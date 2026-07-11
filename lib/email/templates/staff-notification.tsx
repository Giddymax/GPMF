import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

export function StaffNotificationEmail({
  heading,
  lines,
}: {
  heading: string;
  lines: { label: string; value: string }[];
}) {
  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={{ backgroundColor: "#FAFAF7", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px", maxWidth: "480px" }}>
          <Heading style={{ color: "#051429", fontSize: "18px" }}>{heading}</Heading>
          <Hr style={{ borderColor: "#D4AF37", borderWidth: "2px", margin: "16px 0" }} />
          <Section>
            {lines.map((line) => (
              <Text key={line.label} style={{ color: "#4B5563", fontSize: "13px", margin: "4px 0" }}>
                <strong style={{ color: "#051429" }}>{line.label}:</strong> {line.value}
              </Text>
            ))}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default StaffNotificationEmail;
