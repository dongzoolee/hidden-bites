"use client";

import { ChevronDown } from "lucide-react";
import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

export type QnaTone = "yellow" | "pink" | "green";
export type QnaCardVariant = "default" | "featured";

export interface QnaCard {
  title: string;
  body: string;
  bodyLines?: readonly string[];
  meta?: string;
  tone?: QnaTone;
  variant?: QnaCardVariant;
}

export interface QnaFormula {
  label: string;
  expression: string;
}

export interface QnaAccordionItem {
  question: string;
  answer: string;
  tone?: QnaTone;
  cards?: QnaCard[];
  formula?: QnaFormula;
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
              <span className="qna__number">{`${isOpen ? "A" : "Q"}${index + 1}`}</span>
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
                    <article className={buildQnaCardClassName(card, tone)} key={card.title}>
                      <strong>{card.title}</strong>
                      {card.meta ? <span className="qna-card__meta">{card.meta}</span> : null}
                      <p>
                        {card.bodyLines
                          ? card.bodyLines.map((line) => (
                              <span className="qna-card__line" key={line}>
                                {line}
                              </span>
                            ))
                          : card.body}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}
              {item.formula ? (
                <div className="qna-formula">
                  <span>{item.formula.label}</span>
                  <code>{item.formula.expression}</code>
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

function buildQnaCardClassName(card: QnaCard, tone: QnaTone): string {
  return ["qna-card", `qna-card--${card.tone ?? tone}`, card.variant === "featured" ? "qna-card--featured" : ""]
    .filter(Boolean)
    .join(" ");
}
