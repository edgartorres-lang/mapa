"use client";

import type { ReactNode } from "react";
import { brl, digitosParaInteiro } from "@/lib/formato";
import styles from "./campos.module.css";

export function Cartao({ children }: { children: ReactNode }) {
  return <div className={styles.cartao}>{children}</div>;
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <div className={styles.rotulo}>{children}</div>;
}

export function Campo({
  rotulo,
  nota,
  children,
}: {
  rotulo: string;
  nota?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className={styles.rotulo}>
        {rotulo} {nota && <span style={{ fontWeight: 400, fontSize: 10.5, color: "var(--texto-terciario)" }}>· {nota}</span>}
      </div>
      {children}
    </div>
  );
}

export function CampoTexto({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      className={styles.input}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function CampoDinheiro({
  placeholder = "R$ por mês",
  value,
  onChange,
}: {
  placeholder?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      className={`${styles.input} ${styles.dinheiro}`}
      placeholder={placeholder}
      value={value ? brl(value) : ""}
      onChange={(e) => onChange(digitosParaInteiro(e.target.value))}
    />
  );
}

export function CampoSelect({
  value,
  onChange,
  opcoes,
}: {
  value: string;
  onChange: (v: string) => void;
  opcoes: readonly string[];
}) {
  return (
    <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
      {opcoes.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function LinhaCheckbox({
  marcado,
  onToggle,
  children,
}: {
  marcado: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      onClick={onToggle}
      className={`${styles.linha} ${marcado ? styles.marcada : ""}`}
    >
      <span className={`${styles.caixa} ${marcado ? styles.marcada : ""}`}>{marcado ? "✓" : ""}</span>
      <span style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)" }}>{children}</span>
    </div>
  );
}

export function GrupoPill<T extends string>({
  opcoes,
  valor,
  onEscolher,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onEscolher: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {opcoes.map((o) => (
        <div
          key={o.valor}
          onClick={() => onEscolher(o.valor)}
          className={`${styles.pill} ${valor === o.valor ? styles.selecionada : ""}`}
        >
          {o.rotulo}
        </div>
      ))}
    </div>
  );
}

export function BotaoRemover({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={styles.botaoRemover} aria-label="Remover">
      ✕
    </button>
  );
}

export function BotaoAdicionar({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={styles.botaoAdicionar}>
      {children}
    </button>
  );
}
