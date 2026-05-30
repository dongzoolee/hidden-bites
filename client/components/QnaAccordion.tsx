"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface QnaAccordionProps {
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export function QnaAccordion({ items }: QnaAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="qna" aria-label="Project Q and A">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div className="qna__item" key={item.question}>
            <button
              aria-expanded={isOpen}
              className="qna__button"
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <ChevronDown aria-hidden="true" className={isOpen ? "qna__chevron qna__chevron--open" : "qna__chevron"} size={22} />
              <span>{item.question}</span>
            </button>
            <div className={isOpen ? "qna__answer qna__answer--open" : "qna__answer"}>{item.answer}</div>
          </div>
        );
      })}
    </div>
  );
}
