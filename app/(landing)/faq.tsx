"use client";

import { Accordion, AccordionItem } from "@/components/base/accordion/accordion";
import { FAQ } from "./faq-data";

export function FaqList() {
  return (
    <Accordion variant="separated" className="max-w-3xl" data-analytics="landing_faq_open">
      {FAQ.map(({ question, answer }) => (
        <AccordionItem key={question} id={question} title={question}>
          <p className="text-body-regular text-text-secondary">{answer}</p>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
