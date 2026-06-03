"use client";

import { ChevronDown } from "lucide-react";
import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

export type QnaTone = "yellow" | "pink" | "green";

export interface QnaCard {
  title: string;
  body: string;
  tone?: QnaTone;
}

export interface QnaAccordionItem {
  question: string;
  answer: string;
  tone?: QnaTone;
  cards?: QnaCard[];
}

interface QnaAccordionProps {
  items: QnaAccordionItem[];
}

type QnaAnswerStyle = CSSProperties & {
  "--qna-answer-height": string;
};

export function QnaAccordion({ items }: QnaAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const [answerHeights, setAnswerHeights] = useState<number[]>([]);
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLayoutEffect(() => {
    function updateAnswerHeights(): void {
      setAnswerHeights(answerRefs.current.map((node) => node?.scrollHeight ?? 0));
    }

    updateAnswerHeights();
    const resizeObserver = new ResizeObserver(updateAnswerHeights);
    answerRefs.current.forEach((node) => {
      if (node) {
        resizeObserver.observe(node);
      }
    });
    window.addEventListener("resize", updateAnswerHeights);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateAnswerHeights);
    };
  }, [items]);

  return (
    <div className="qna" aria-label="Project Q and A">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const tone = item.tone ?? toneByIndex(index);
        const answerId = `qna-answer-${index}`;
        const answerStyle: QnaAnswerStyle = {
          "--qna-answer-height": `${answerHeights[index] ?? 0}px`,
        };

        return (
          <div className={`qna__item qna__item--${tone}`} key={item.question}>
            <button
              aria-controls={answerId}
              aria-expanded={isOpen}
              className="qna__button"
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span className="qna__number">{String(index + 1).padStart(2, "0")}</span>
              <span>{item.question}</span>
              <ChevronDown aria-hidden="true" className={isOpen ? "qna__chevron qna__chevron--open" : "qna__chevron"} size={22} />
            </button>
            <div
              aria-hidden={!isOpen}
              className={isOpen ? "qna__answer qna__answer--open" : "qna__answer"}
              id={answerId}
              ref={(node) => {
                answerRefs.current[index] = node;
              }}
              style={answerStyle}
            >
              <p>{item.answer}</p>
              {item.cards?.length ? (
                <div className="qna-card-row">
                  {item.cards.map((card) => (
                    <article className={`qna-card qna-card--${card.tone ?? tone}`} key={card.title}>
                      <strong>{card.title}</strong>
                      <p>{card.body}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function toneByIndex(index: number): QnaTone {
  if (index === 1) {
    return "pink";
  }

  if (index === 2) {
    return "green";
  }

  return "yellow";
}
