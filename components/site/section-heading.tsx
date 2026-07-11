import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className="eyebrow mb-3 text-xs sm:text-sm">{eyebrow}</p> : null}
      <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{title}</h2>
      <div className={cn("rule-gold mt-4 w-16", align === "center" && "mx-auto")} />
      {description ? (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
