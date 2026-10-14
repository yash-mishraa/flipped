"use client";

import React, {
  isValidElement,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./BranchedMenu.css";

export interface BranchedMenuLeaf {
  readonly value: string;
  readonly label: string;
  readonly icon?: ReactNode;
}

export interface BranchedMenuSection {
  readonly label: string;
  readonly value?: string;
  readonly children?: readonly BranchedMenuLeaf[];
}

export interface BranchedMenuProps {
  readonly items: readonly BranchedMenuSection[];
  readonly defaultOpen?: number | readonly number[];
  readonly defaultActive?: string;
  readonly onSelect?: (value: string, item: BranchedMenuLeaf | BranchedMenuSection) => void;
  readonly onToggle?: (index: number, open: boolean) => void;
  readonly color?: string;
  readonly accentColor?: string;
  readonly lineColor?: string;
  readonly width?: number;
  readonly rowHeight?: number;
  readonly indent?: number;
  readonly trunk?: number;
  readonly radius?: number;
  readonly lineWidth?: number;
  readonly fontSize?: number;
  readonly drawDuration?: number;
  readonly foldDuration?: number;
  readonly className?: string;
}

const PAD = 6;
const MARK = 16;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const toSet = (open: number | readonly number[] | undefined): Set<number> =>
  new Set(Array.isArray(open) ? open : typeof open === "number" && open >= 0 ? [open] : []);

export default function BranchedMenu({
  items,
  defaultOpen = 0,
  defaultActive = "",
  onSelect,
  onToggle,
  color = "#32171D",
  accentColor = "#7B1E2B",
  lineColor = "#C49A6C",
  width = 240,
  rowHeight = 36,
  indent = 40,
  trunk = 14,
  radius = 10,
  lineWidth = 1.5,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className = "",
}: BranchedMenuProps): React.JSX.Element {
  const [open, setOpen] = useState<Set<number>>(() => toSet(defaultOpen));
  const [active, setActive] = useState<string>(() => {
    if (defaultActive) return defaultActive;
    const initialSet = toSet(defaultOpen);
    const first = items.find((it, i) => it.children && initialSet.has(i));
    return first?.children?.[0]?.value ?? "";
  });

  const navRef = useRef<HTMLElement | null>(null);
  const heads = useRef<(HTMLButtonElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const latest = useRef<{
    onSelect?: (value: string, item: BranchedMenuLeaf | BranchedMenuSection) => void;
    onToggle?: (index: number, open: boolean) => void;
  }>({});
  latest.current = { onSelect, onToggle };

  const activeSection = items.findIndex((it) => it.children?.some((kid) => kid.value === active));
  const markerShown = activeSection >= 0 && open.has(activeSection);

  useIsomorphicLayoutEffect(() => {
    const place = (glide: boolean) => {
      const m = markerRef.current;
      const el = heads.current[activeSection];
      if (!m) return;
      const on = Boolean(markerShown && el);
      if (!glide) m.style.transition = "none";
      if (on && el) {
        m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
        m.setAttribute("data-on", "");
      } else {
        m.removeAttribute("data-on");
      }
      if (!glide) {
        void m.offsetHeight;
        m.style.transition = "";
      }
    };

    place(true);
    let first = true;
    if (typeof ResizeObserver !== "undefined" && navRef.current) {
      const ro = new ResizeObserver(() => {
        if (first) {
          first = false;
          return;
        }
        place(false);
      });
      ro.observe(navRef.current);
      return () => ro.disconnect();
    }
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const select = (value: string, item: BranchedMenuLeaf | BranchedMenuSection) => {
    setActive(value);
    latest.current.onSelect?.(value, item);
  };

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      const isOpen = !next.has(i);
      if (isOpen) next.add(i);
      else next.delete(i);
      latest.current.onToggle?.(i, isOpen);
      return next;
    });
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = (k: number) => PAD + k * rowHeight + rowHeight / 2;
  const branch = (k: number) =>
    `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const reach = (k: number) =>
    `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const length = (k: number) => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);

  return (
    <nav
      ref={navRef}
      className={`branched-menu${className ? ` ${className}` : ""}`}
      style={
        {
          "--bm-w": `${width}px`,
          "--bm-ink": color,
          "--bm-accent": accentColor,
          "--bm-line": lineColor,
          "--bm-font": `${fontSize}px`,
          "--bm-row": `${rowHeight}px`,
          "--bm-indent": `${indent}px`,
          "--bm-line-w": lineWidth,
          "--bm-draw": `${drawDuration}ms`,
          "--bm-fold": `${foldDuration}ms`,
        } as React.CSSProperties
      }
    >
      <span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value ?? item.label;
        const leafActive = !kids && leafValue === active;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;

        return (
          <div
            key={item.value ?? item.label}
            className="branched-menu__section"
            data-open={isOpen ? "" : undefined}
          >
            <button
              ref={(el) => {
                heads.current[i] = el;
              }}
              type="button"
              className="branched-menu__head"
              aria-expanded={kids ? isOpen : undefined}
              aria-current={leafActive ? "true" : undefined}
              data-active={leafActive ? "" : undefined}
              onClick={() => (kids ? toggle(i) : select(leafValue, item))}
            >
              {item.label}
            </button>
            {kids ? (
              <div className="branched-menu__body">
                <div className="branched-menu__fold">
                  <div className="branched-menu__tree" style={{ height: bodyH }}>
                    <svg
                      className="branched-menu__lines"
                      width={indent}
                      height={bodyH}
                      aria-hidden="true"
                    >
                      <path
                        className="branched-menu__base"
                        d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`}
                      />
                      {kids.map((kid, k) => (
                        <path key={kid.value} className="branched-menu__base" d={branch(k)} />
                      ))}
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className="branched-menu__reach"
                          d={reach(k)}
                          style={{
                            strokeDasharray: length(k),
                            strokeDashoffset: kid.value === active ? 0 : length(k),
                          }}
                        />
                      ))}
                    </svg>
                    {kids.map((kid) => (
                      <button
                        key={kid.value}
                        type="button"
                        className="branched-menu__item"
                        aria-current={kid.value === active ? "true" : undefined}
                        data-active={kid.value === active ? "" : undefined}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => select(kid.value, kid)}
                      >
                        {kid.icon && isValidElement(kid.icon) ? (
                          <span className="branched-menu__icon" aria-hidden="true">
                            {kid.icon}
                          </span>
                        ) : null}
                        <span className="branched-menu__label">{kid.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
