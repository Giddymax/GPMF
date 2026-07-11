import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";

export function ApplicationConfirmationEmail({
  fullName,
  product,
  referenceCode,
  siteUrl,
}: {
  fullName: string;
  product: string;
  referenceCode: string;
  siteUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>We received your {product} application — reference {referenceCode}</Preview>
      <Body style={{ backgroundColor: "#FAFAF7", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px", maxWidth: "480px" }}>
          <Img src={`${siteUrl}/brand/logo-white-bg.png`} width="180" alt="Grainy Palace Financial Service" />
          <Hr style={{ borderColor: "#D4AF37", borderWidth: "2px", margin: "20px 0" }} />
          <Heading style={{ color: "#051429", fontSize: "20px" }}>Thank you, {fullName}</Heading>
          <Text style={{ color: "#4B5563", fontSize: "14px", lineHeight: "22px" }}>
            We received your application for <strong>{product}</strong>. A member of our team will
            contact you within one business day to complete your registration.
          </Text>
          <Section style={{ backgroundColor: "#F0EFE9", padding: "16px", borderRadius: "8px", margin: "20px 0" }}>
            <Text style={{ color: "#4B5563", fontSize: "12px", margin: 0 }}>Your reference number</Text>
            <Text style={{ color: "#051429", fontSize: "20px", fontWeight: 700, margin: "4px 0 0" }}>
              {referenceCode}
            </Text>
          </Section>
          <Text style={{ color: "#4B5563", fontSize: "12px", lineHeight: "20px" }}>
            Please bring your Ghana Card and a passport-sized photograph when our agent visits or
            when you next visit our office. If you did not submit this application, please
            disregard this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ApplicationConfirmationEmail;
