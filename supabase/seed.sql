-- Demo data: ~30 clients across all products, 2 lending groups, 3 agents,
-- roughly 6 months of history — so every admin screen and every SEEP/CGAP
-- ratio on the dashboard renders with real numbers instead of empty states.
--
-- This is demo data only. Run against a fresh `supabase db reset` (which
-- applies supabase/migrations/* first, then this file). It does not create
-- Supabase Auth logins — see scripts/create-demo-staff.ts / README "Setup".

do $$
declare
  v_agent_ids uuid[] := array[]::uuid[];
  v_agent_id uuid;
  v_client_ids uuid[] := array[]::uuid[];
  v_savings_account_ids uuid[] := array[]::uuid[];
  v_susu_account_ids uuid[] := array[]::uuid[];
  v_client_id uuid;
  v_savings_id uuid;
  v_susu_id uuid;
  v_cycle_id uuid;
  v_group_ids uuid[] := array[]::uuid[];
  v_group_id uuid;
  v_loan_id uuid;
  v_fd_id uuid;

  v_names text[] := array[
    'Ama Owusu','Kwame Boateng','Efua Mensah','Kofi Asante','Abena Darko',
    'Yaw Agyeman','Akosua Frimpong','Kwabena Osei','Adjoa Sarpong','Kwaku Appiah',
    'Afia Nyarko','Kojo Amoah','Esi Baah','Yaw Danquah','Abla Kusi',
    'Kwesi Twum','Akua Gyasi','Kwadwo Adjei','Abenaa Serwaa','Kwame Ntim',
    'Adwoa Antwi','Fiifi Aidoo','Akoto Manu','Nana Yeboah','Efua Anokye',
    'Kwame Duah','Ama Konadu','Kojo Baffoe','Adjoa Amponsah','Kwabena Ofori'
  ];
  v_towns text[] := array['Nsawam','Suhum','Koforidua','Nkawkaw','Mpraeso'];

  v_start date := (current_date - interval '6 months')::date;
  i int;
  d int;
  v_daily numeric;
  v_days_paid int;
  v_amount numeric;
  v_principal numeric;
  v_months int;
  v_freq repayment_frequency;
  v_periods int;
  v_total numeric;
  v_per numeric;
  v_due date;
  v_schedule_id uuid;
begin
  -- ==========================================================================
  -- AGENTS
  -- ==========================================================================
  insert into agents (employee_code, full_name, phone, route, active)
  values ('AG-001', 'Yaw Mensah-Bonsu', '0244000001', 'Nsawam Market Route', true)
  returning id into v_agent_id;
  v_agent_ids := v_agent_ids || v_agent_id;

  insert into agents (employee_code, full_name, phone, route, active)
  values ('AG-002', 'Abena Owusu-Ansah', '0244000002', 'Suhum Lorry Station Route', true)
  returning id into v_agent_id;
  v_agent_ids := v_agent_ids || v_agent_id;

  insert into agents (employee_code, full_name, phone, route, active)
  values ('AG-003', 'Kwesi Ababio', '0244000003', 'Koforidua Central Route', true)
  returning id into v_agent_id;
  v_agent_ids := v_agent_ids || v_agent_id;

  -- ==========================================================================
  -- CLIENTS + SAVINGS + SUSU ACCOUNTS, round-robin across the 3 agents
  -- ==========================================================================
  for i in 1..30 loop
    insert into clients (client_code, full_name, phone, ghana_card_no, town, agent_id, status)
    values (
      'GPFS-' || lpad(i::text, 4, '0'),
      v_names[i],
      '02440' || lpad((10000 + i)::text, 5, '0'),
      'GHA-' || lpad((100000000 + i)::text, 9, '0') || '-' || (i % 10),
      v_towns[1 + (i % array_length(v_towns, 1))],
      v_agent_ids[1 + (i % 3)],
      'active'
    )
    returning id into v_client_id;
    v_client_ids := v_client_ids || v_client_id;

    insert into accounts (client_id, account_type, account_number)
    values (v_client_id, 'savings', 'SAV-' || lpad(i::text, 5, '0'))
    returning id into v_savings_id;
    v_savings_account_ids := v_savings_account_ids || v_savings_id;

    insert into accounts (client_id, account_type, account_number)
    values (v_client_id, 'susu', 'SUS-' || lpad(i::text, 5, '0'))
    returning id into v_susu_id;
    v_susu_account_ids := v_susu_account_ids || v_susu_id;

    -- Opening savings deposit + two top-ups across the 6-month window.
    v_amount := 50 + (i * 7 % 150);
    perform post_ledger_transaction(
      'Opening savings deposit', 'savings_deposit', v_savings_id,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'CASH_HAND', 'debit', v_amount, 'agent_id', v_agent_ids[1 + (i % 3)]),
        jsonb_build_object('gl_code', 'SAVINGS_LIAB', 'credit', v_amount, 'client_account_id', v_savings_id)
      ),
      null, v_start
    );
    insert into savings_transactions (account_id, type, amount, created_at)
    values (v_savings_id, 'deposit', v_amount, v_start);

    v_amount := 30 + (i * 11 % 120);
    perform post_ledger_transaction(
      'Savings top-up', 'savings_deposit', v_savings_id,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'CASH_HAND', 'debit', v_amount, 'agent_id', v_agent_ids[1 + (i % 3)]),
        jsonb_build_object('gl_code', 'SAVINGS_LIAB', 'credit', v_amount, 'client_account_id', v_savings_id)
      ),
      null, (v_start + interval '2 months')::date
    );
    insert into savings_transactions (account_id, type, amount, created_at)
    values (v_savings_id, 'deposit', v_amount, v_start + interval '2 months');

    -- One completed susu cycle (varying how many days were actually paid,
    -- so the demo data exercises both the full-commission and sparse-commission paths)
    -- plus one currently-active cycle.
    v_daily := 5 + (i % 20);
    v_days_paid := case when i % 4 = 0 then 12 else 27 + (i % 4) end; -- some sparse, most near-full

    insert into susu_cycles (account_id, cycle_number, daily_amount, start_date, end_date, status)
    values (v_susu_id, 1, v_daily, v_start, v_start + interval '30 days', 'completed')
    returning id into v_cycle_id;

    for d in 1..least(v_days_paid, 31) loop
      insert into susu_contributions (cycle_id, collected_by, amount, collected_at)
      values (v_cycle_id, v_agent_ids[1 + (i % 3)], v_daily, v_start + (d || ' days')::interval);
    end loop;

    perform post_ledger_transaction(
      'Susu collections, cycle 1', 'susu_contribution', v_cycle_id,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'CASH_HAND', 'debit', v_daily * least(v_days_paid, 31), 'agent_id', v_agent_ids[1 + (i % 3)]),
        jsonb_build_object('gl_code', 'SUSU_LIAB', 'credit', v_daily * least(v_days_paid, 31), 'client_account_id', v_susu_id)
      ),
      null, (v_start + interval '30 days')::date
    );

    insert into susu_cycles (account_id, cycle_number, daily_amount, start_date, end_date, status)
    values (v_susu_id, 2, v_daily, v_start + interval '31 days', v_start + interval '61 days', 'active');

    v_client_ids := v_client_ids; -- no-op, keeps declared var used across loop
  end loop;

  -- ==========================================================================
  -- FIXED DEPOSITS for 8 clients across the 3 tenors
  -- ==========================================================================
  for i in 1..8 loop
    v_principal := 500 + (i * 137 % 2000);
    v_months := (array[3, 6, 12])[1 + (i % 3)];

    insert into fixed_deposits (client_id, fd_number, principal, annual_rate, term_months, start_date, maturity_date, status)
    values (
      v_client_ids[i], 'FD-' || lpad(i::text, 4, '0'), v_principal,
      (array[0.10, 0.12, 0.14])[1 + (i % 3)], v_months,
      v_start + interval '1 month', (v_start + interval '1 month') + (v_months || ' months')::interval,
      'active'
    )
    returning id into v_fd_id;

    perform post_ledger_transaction(
      'Fixed deposit booking', 'fd_booking', v_fd_id,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'BANK', 'debit', v_principal),
        jsonb_build_object('gl_code', 'FD_LIAB', 'credit', v_principal, 'fixed_deposit_id', v_fd_id)
      ),
      null, (v_start + interval '1 month')::date
    );
  end loop;

  -- ==========================================================================
  -- INDIVIDUAL LOANS for 15 clients: disbursed, with a running repayment
  -- schedule so PAR buckets and provisioning have real data to show.
  -- ==========================================================================
  for i in 1..15 loop
    v_principal := 300 + (i * 53 % 900);
    v_months := 3 + (i % 4);
    v_freq := (array['weekly', 'monthly', 'daily'])[1 + (i % 3)];
    v_periods := case v_freq when 'monthly' then v_months when 'weekly' then round(v_months * 52.0 / 12) else v_months * 30 end;
    v_total := v_principal * (1 + 0.045 * v_months);
    v_per := round(v_total / v_periods, 2);

    insert into loans (loan_number, loan_type, client_id, principal, monthly_flat_rate, term_months, frequency, processing_fee, status, approved_at, disbursed_at)
    values (
      'LN-' || lpad(i::text, 4, '0'), 'individual', v_client_ids[i], v_principal, 0.045, v_months, v_freq,
      round(v_principal * 0.02, 2), 'disbursed', v_start + interval '2 months', v_start + interval '2 months'
    )
    returning id into v_loan_id;

    perform post_ledger_transaction(
      'Loan disbursement', 'loan_disbursement', v_loan_id,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'LOAN_PORTFOLIO', 'debit', v_principal, 'loan_id', v_loan_id),
        jsonb_build_object('gl_code', 'CASH_HAND', 'credit', v_principal, 'agent_id', v_agent_ids[1 + (i % 3)])
      ),
      null, (v_start + interval '2 months')::date
    );

    -- Build the repayment schedule (weekly cadence used for demo dates regardless of frequency, for simplicity).
    for d in 1..least(v_periods, 12) loop
      v_due := (v_start + interval '2 months')::date + (d * 7);
      insert into loan_schedules (loan_id, period_number, due_date, principal_due, interest_due, total_due, status)
      values (v_loan_id, d, v_due, round(v_per * (v_principal / v_total), 2), round(v_per * (1 - v_principal / v_total), 2), v_per,
        'pending')
      returning id into v_schedule_id;

      -- Most clients pay on time (first 70% of due-in-the-past installments); a few fall behind.
      if v_due < current_date and (i % 5 <> 0 or d < 3) then
        update loan_schedules set status = 'paid' where id = v_schedule_id;
        insert into loan_repayments (loan_id, schedule_id, amount, collected_by, paid_at)
        values (v_loan_id, v_schedule_id, v_per, v_agent_ids[1 + (i % 3)], v_due);

        perform post_ledger_transaction(
          'Loan repayment', 'loan_repayment', v_loan_id,
          jsonb_build_array(
            jsonb_build_object('gl_code', 'CASH_HAND', 'debit', v_per, 'agent_id', v_agent_ids[1 + (i % 3)]),
            jsonb_build_object('gl_code', 'LOAN_PORTFOLIO', 'credit', round(v_per * (v_principal / v_total), 2), 'loan_id', v_loan_id),
            jsonb_build_object('gl_code', 'INT_INCOME', 'credit', round(v_per * (1 - v_principal / v_total), 2), 'flow_category', 'loan_interest')
          ),
          null, v_due
        );
      end if;
    end loop;
  end loop;

  -- Mark overdue schedules for loans that fell behind, so PAR buckets populate.
  update loan_schedules set status = 'overdue' where status = 'pending' and due_date < current_date;

  -- ==========================================================================
  -- GRAMEEN GROUP LENDING: 2 groups of 5 members each
  -- ==========================================================================
  for i in 1..2 loop
    insert into groups (name, agent_id, status)
    values ('Market Women Group ' || i, v_agent_ids[i], 'active')
    returning id into v_group_id;
    v_group_ids := v_group_ids || v_group_id;

    for d in 1..5 loop
      insert into group_members (group_id, client_id, tranche_index, status)
      values (
        v_group_id,
        v_client_ids[15 + (i - 1) * 5 + d],
        case when d <= 2 then 0 when d <= 4 then 1 else 2 end,
        (case when d <= 2 then 'current' else 'pending' end)::group_member_status
      );
    end loop;

    -- Compulsory group collateral (10% of a notional GHS 2,000 group loan ceiling).
    perform post_ledger_transaction(
      'Group compulsory savings collateral', 'group_collateral', v_group_id,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'CASH_HAND', 'debit', 200, 'agent_id', v_agent_ids[i]),
        jsonb_build_object('gl_code', 'GROUP_COLLATERAL', 'credit', 200, 'group_id', v_group_id)
      ),
      null, (v_start + interval '1 month')::date
    );

    -- First tranche (2 members) disbursed.
    insert into loans (loan_number, loan_type, group_id, principal, monthly_flat_rate, term_months, frequency, processing_fee, status, approved_at, disbursed_at)
    values ('GLN-' || lpad(i::text, 4, '0'), 'group', v_group_id, 800, 0.045, 4, 'weekly', 16, 'disbursed', v_start + interval '2 months', v_start + interval '2 months')
    returning id into v_loan_id;

    perform post_ledger_transaction(
      'Group loan disbursement, tranche 1', 'loan_disbursement', v_loan_id,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'LOAN_PORTFOLIO', 'debit', 800, 'loan_id', v_loan_id, 'group_id', v_group_id),
        jsonb_build_object('gl_code', 'CASH_HAND', 'credit', 800, 'agent_id', v_agent_ids[i])
      ),
      null, (v_start + interval '2 months')::date
    );
  end loop;

  -- ==========================================================================
  -- TREASURY: two T-bill placements
  -- ==========================================================================
  perform post_ledger_transaction(
    'T-bill placement, 91-day', 'treasury_placement', null,
    jsonb_build_array(
      jsonb_build_object('gl_code', 'TBILL', 'debit', 3000),
      jsonb_build_object('gl_code', 'BANK', 'credit', 3000)
    ),
    null, (v_start + interval '1 month')::date
  );
  insert into treasury_placements (instrument, principal, annual_rate, placed_date, maturity_date, status)
  values ('T-bill', 3000, 0.22, v_start + interval '1 month', v_start + interval '4 months', 'matured');

  perform post_ledger_transaction(
    'T-bill placement, 182-day', 'treasury_placement', null,
    jsonb_build_array(
      jsonb_build_object('gl_code', 'TBILL', 'debit', 2000),
      jsonb_build_object('gl_code', 'BANK', 'credit', 2000)
    ),
    null, (current_date - interval '2 months')::date
  );
  insert into treasury_placements (instrument, principal, annual_rate, placed_date, maturity_date, status)
  values ('T-bill', 2000, 0.24, current_date - interval '2 months', current_date + interval '4 months', 'active');

  -- Treasury income booked on the matured 91-day bill.
  perform post_ledger_transaction(
    'T-bill maturity interest', 'treasury_income', null,
    jsonb_build_array(
      jsonb_build_object('gl_code', 'BANK', 'debit', 165),
      jsonb_build_object('gl_code', 'INT_INCOME', 'credit', 165, 'flow_category', 'treasury_income')
    ),
    null, (v_start + interval '4 months')::date
  );

  -- ==========================================================================
  -- OPENING EQUITY (so the balance sheet balances: assets = liabilities + equity)
  -- ==========================================================================
  perform post_ledger_transaction(
    'Founding shareholder capital injection', 'equity_injection', null,
    jsonb_build_array(
      jsonb_build_object('gl_code', 'BANK', 'debit', 15000),
      jsonb_build_object('gl_code', 'EQUITY', 'credit', 15000)
    ),
    null, v_start
  );
end $$;

-- ============================================================================
-- WEBSITE INBOX SAMPLES
-- ============================================================================
insert into applications (reference_code, product, full_name, phone, email, ghana_card_no, town, amount, frequency, status) values
  ('APP-1001', 'daily-susu', 'Serwaa Boadi', '0201234567', null, 'GHA-000111222-1', 'Nsawam', 10, 'daily', 'new'),
  ('APP-1002', 'loans', 'Kwame Adom', '0207654321', 'kwame.adom@example.com', 'GHA-000333444-2', 'Suhum', 400, null, 'contacted'),
  ('APP-1003', 'fixed-deposit', 'Abena Owusu', '0244112233', null, 'GHA-000555666-3', 'Koforidua', 1500, null, 'new'),
  ('APP-1004', 'savings', 'Yaw Sarfo', '0244998877', 'yaw.sarfo@example.com', 'GHA-000777888-4', 'Nkawkaw', 100, null, 'opened'),
  ('APP-1005', 'daily-susu', 'Afia Boateng', '0201122334', null, 'GHA-000999000-5', 'Mpraeso', 20, 'daily', 'new');

insert into inquiries (name, phone, email, subject, message, status) values
  ('Kojo Mensah', '0244555666', 'kojo.mensah@example.com', 'Lost passbook', 'I lost my susu passbook, how do I get a replacement?', 'new'),
  ('Adjoa Frimpong', '0201998877', null, 'Withdrawal question', 'Can I withdraw my savings before the account is 3 months old?', 'resolved'),
  ('Kwabena Osei', '0244221100', 'kwabena.osei@example.com', 'Agent verification', 'How do I know your mobile banker is genuine?', 'contacted');

-- ============================================================================
-- PUBLIC SITE CONTENT
-- ============================================================================
insert into posts (slug, title, excerpt, body, published, published_at, author) values
  ('community-durbar-launch', 'Grainy Palace opens its doors with a community durbar',
   'Chiefs, market queens and hundreds of traders welcomed Grainy Palace Financial Service to town.',
   'Grainy Palace Financial Service opened its Nsawam office with a community durbar attended by the local chief, assembly member, market queen and church and mosque leaders. Trust is the product we are selling, and there is no better way to earn it than showing up in the community that will hold our passbooks.',
   true, now() - interval '5 months', 'Grainy Palace Comms'),
  ('susu-101', 'Susu 101: how your daily contribution becomes a lump sum',
   'A plain-English walkthrough of the 31-day susu cycle, from first contribution to payout.',
   'Every day, one of our mobile bankers visits your stall or shop and collects whatever amount you have chosen to save. After 31 days, you get the full amount back, minus one day''s contribution as our collection fee. No paperwork, no queues — just discipline, one cedi at a time.',
   true, now() - interval '3 months', 'Grainy Palace Comms'),
  ('first-loan-milestone', '50 micro-loans disbursed to market traders',
   'Our susu clients are now graduating into working-capital loans for their stalls.',
   'Fifty of our longest-standing susu and savings clients have now received micro-loans to restock their stalls ahead of the festive season — proof that a clean savings record really is a credit score in this town.',
   true, now() - interval '1 month', 'Grainy Palace Comms');

insert into testimonials (name, town, quote, product, sort_order) values
  ('Ama Owusu', 'Nsawam', 'My susu collector comes to my stall every morning, rain or shine. I have never had to close my shop to go to a bank.', 'daily-susu', 1),
  ('Kwame Boateng', 'Suhum', 'I saved for eight months before I asked for a loan. They approved it in two days because my savings record spoke for me.', 'loans', 2),
  ('Efua Mensah', 'Koforidua', 'The fixed deposit rate is better than anything my old bank offered, and the manager still remembers my name.', 'fixed-deposit', 3),
  ('Kofi Asante', 'Nkawkaw', 'When I lost my passbook, they sorted it out the same day with my Ghana Card. No wahala.', 'savings', 4);

insert into faqs (question, answer, category, sort_order) values
  ('Is my money safe with Grainy Palace?', 'Yes. Every cedi you save is recorded in our double-entry ledger the moment our agent collects it, you get an instant receipt, and we keep a minimum 30% liquidity reserve at all times so withdrawals are never a problem.', 'safety', 1),
  ('How do I know my mobile banker is genuine?', 'Every agent carries a photo ID card and issues a printed or SMS receipt for every single collection. If a collector cannot produce both, do not hand over your money — call our office immediately.', 'safety', 2),
  ('Can I withdraw my savings at any time?', 'Yes, savings accounts allow withdrawals at any time (a small fee applies). Susu contributions are designed to be held for the full 31-day cycle, and fixed deposits carry an early-termination adjustment if broken before maturity.', 'withdrawals', 3),
  ('What interest rates do you offer?', 'Savings pay around 5% per year, fixed deposits pay 10-14% per year depending on the term, and susu charges one day''s contribution per month as a collection fee. Exact current rates are always posted in our banking hall and on our Products pages.', 'rates', 4),
  ('I lost my passbook — what do I do?', 'Visit any branch with your Ghana Card. We will verify your identity against your client record and issue a replacement the same day.', 'safety', 5),
  ('How do I qualify for a loan?', 'Your own savings or susu record is your credit score: after 2 completed susu cycles or 3 months of savings history, you can borrow up to twice your average monthly savings inflow.', 'loans', 6);

insert into rates (product, label, rate, unit, term_months, sort_order) values
  ('savings', 'Savings account', 0.05, 'pa', null, 1),
  ('daily-susu', 'Susu collection fee', 0.032, 'monthly_of_collections', null, 2),
  ('fixed-deposit', '3-month fixed deposit', 0.10, 'pa', 3, 3),
  ('fixed-deposit', '6-month fixed deposit', 0.12, 'pa', 6, 4),
  ('fixed-deposit', '12-month fixed deposit', 0.14, 'pa', 12, 5),
  ('loans', 'Micro-loan interest', 0.045, 'flat_monthly', null, 6),
  ('loans', 'Loan processing fee', 0.02, 'pct_of_principal', null, 7);

insert into site_stats (label, value, suffix, sort_order) values
  ('Active clients', 30, '+', 1),
  ('Field agents', 3, '', 2),
  ('GHS mobilised', 45000, '+', 3),
  ('Years serving the community', 1, '', 4);

insert into team_members (full_name, role_title, bio, sort_order) values
  ('Abena Nyarko', 'Chief Executive Officer', 'Founding CEO with a background in rural banking and a mission to bring safe, convenient savings to underserved market towns.', 1),
  ('Kwesi Amankwah', 'Head of Credit', 'Leads credit policy and loan appraisal, with a career built on disciplined, community-based lending.', 2),
  ('Efua Owusu-Sarpong', 'Head of Operations', 'Oversees the branch, cash controls and the field agent network that makes daily susu collection possible.', 3),
  ('Kojo Antwi-Boasiako', 'Compliance & Risk Officer', 'Keeps Grainy Palace aligned with Bank of Ghana guidelines and AML/CFT best practice.', 4);
