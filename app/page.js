"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";

const I18N = {
  ko: {
    logoSub: "조선서재",
    tagline: "AI × 문화재청 공공데이터 기반 역사 웹소설 고증 어시스턴트",
    dataBadge: "문화공공데이터광장 연동 중",
    eraLabel: "시대 설정",
    categoryLabel: "고증 분야",
    eras: ["조선 초기", "조선 중기", "조선 후기", "고려", "삼국시대", "시대 무관"],
    categories: ["복식·의복", "관직·제도", "건축·공간", "음식·예절", "무기·전투", "신분·사회", "기타"],
    welcomeTitle: "사관(史官)AI에게 물어보세요",
    welcomeDesc: "역사 웹소설 창작에 필요한 복식, 관직, 건축, 예절 등\n문화재청 공공데이터에 근거한 고증 정보를 제공합니다",
    examplesLabel: "예시 질문",
    examples: [
      "조선 중기 사대부 남성의 일상 복식은 어떻게 묘사하면 되나요?",
      "영의정과 좌의정의 차이와 관복 색상은?",
      "궁궐 내 상궁과 나인의 위계 구조를 설명해주세요",
      "고려시대 무신 장군이 입는 갑옷 종류는?",
      "조선시대 양반가 사랑채와 안채의 구분과 쓰임새는?",
    ],
    placeholder: (era, cat) => `${era} · ${cat} 관련 고증 질문을 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)`,
    sendBtn: "問",
    typing: "사관AI가 고증 자료를 검토하고 있습니다...",
    heritageTitle: "📚 문화재청 공공데이터 연동 결과",
    dataNote: "* 국가유산청 공공데이터가 연동되었습니다",
    hint: "본 서비스는 문화공공데이터광장·문화재청 공공데이터를 활용합니다 | 제4회 문화체육관광 AI·데이터 활용 공모전 출품작",
    error: "오류가 발생했습니다.",
  },
  en: {
    logoSub: "Joseon Seojae",
    tagline: "AI × Korea Heritage Administration Open Data — Historical Fiction Research Assistant",
    dataBadge: "Korea Heritage Data Connected",
    eraLabel: "Era",
    categoryLabel: "Category",
    eras: ["Early Joseon", "Mid Joseon", "Late Joseon", "Goryeo", "Three Kingdoms", "Any Era"],
    categories: ["Clothing", "Official Titles", "Architecture", "Food & Etiquette", "Weapons & Combat", "Social Class", "Other"],
    welcomeTitle: "Ask the Royal Historian AI",
    welcomeDesc: "Get historically accurate information for your Korean historical fiction —\nclothing, official titles, architecture, customs, and more.",
    examplesLabel: "Example questions",
    examples: [
      "How should I describe the everyday clothing of a mid-Joseon male nobleman?",
      "What's the difference between Yeonguijeong and Jwauijeong, and their court robe colors?",
      "Explain the hierarchy between Sanggung and Naein inside the royal palace.",
      "What types of armor did Goryeo military generals wear?",
      "What were the Sarangchae and Anchae rooms in a Joseon aristocratic house?",
    ],
    placeholder: (era, cat) => `Ask about ${era} · ${cat} (Enter to send, Shift+Enter for new line)`,
    sendBtn: "Ask",
    typing: "The Royal Historian AI is reviewing historical records...",
    heritageTitle: "📚 Korea Heritage Administration Data",
    dataNote: "* Korea Heritage Administration open data connected",
    hint: "Powered by Korea Heritage Administration Open Data | 4th Culture, Sports & Tourism AI·Data Competition",
    error: "An error occurred. Please try again.",
  },
};

export default function HomePage() {
  const [lang, setLang] = useState("ko");
  const [question, setQuestion] = useState("");
  const [eraIdx, setEraIdx] = useState(1);
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const t = I18N[lang];
  const era = t.eras[eraIdx];
  const category = t.categories[categoryIdx];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (q = question) => {
    if (!q.trim() || loading) return;
    setError("");
    const userMsg = { role: "user", text: q.trim(), time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/sajeon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim(), era, category, lang }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiMsg = {
        role: "assistant",
        text: data.answer,
        heritageItems: data.heritageItems || [],
        usedData: data.usedData,
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      setError(e.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderAnswer = (text) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className={styles.answerBold}>{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.match(/^\*\*(.+)\*\*/)) {
        const rendered = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        return <p key={i} className={styles.answerLine} dangerouslySetInnerHTML={{ __html: rendered }} />;
      }
      if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.")) {
        return <p key={i} className={styles.answerItem}>{line}</p>;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className={styles.answerLine}>{line}</p>;
    });
  };

  return (
    <div className={styles.root}>
      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <div className={styles.logo}>
              <span className={styles.logoHanja}>朝鮮書齋</span>
              <span className={styles.logoKr}>{t.logoSub}</span>
            </div>
            <button
              className={styles.langToggle}
              onClick={() => { setLang(lang === "ko" ? "en" : "ko"); setMessages([]); setError(""); }}
            >
              {lang === "ko" ? "🌐 English" : "🌐 한국어"}
            </button>
          </div>
          <p className={styles.tagline}>{t.tagline}</p>
          <div className={styles.dataBadge}>
            <span className={styles.dot} />
            {t.dataBadge}
          </div>
        </div>
        <div className={styles.headerDeco} />
      </header>

      {/* ── 메인 ── */}
      <main className={styles.main}>
        {/* 설정 패널 */}
        <div className={styles.settingsPanel}>
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>{t.eraLabel}</label>
            <div className={styles.chips}>
              {t.eras.map((e, i) => (
                <button
                  key={e}
                  className={`${styles.chip} ${eraIdx === i ? styles.chipActive : ""}`}
                  onClick={() => setEraIdx(i)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>{t.categoryLabel}</label>
            <div className={styles.chips}>
              {t.categories.map((c, i) => (
                <button
                  key={c}
                  className={`${styles.chip} ${categoryIdx === i ? styles.chipActive : ""}`}
                  onClick={() => setCategoryIdx(i)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 대화 영역 */}
        <div className={styles.chatArea}>
          {messages.length === 0 && !loading && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>史</div>
              <h2 className={styles.welcomeTitle}>{t.welcomeTitle}</h2>
              <p className={styles.welcomeDesc}>
                {t.welcomeDesc.split("\n").map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
              <div className={styles.examples}>
                <p className={styles.examplesLabel}>{t.examplesLabel}</p>
                <div className={styles.exampleList}>
                  {t.examples.map((q, i) => (
                    <button
                      key={i}
                      className={styles.exampleBtn}
                      onClick={() => handleSubmit(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.message} ${msg.role === "user" ? styles.userMessage : styles.aiMessage}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {msg.role === "assistant" && (
                <div className={styles.aiAvatar}>史</div>
              )}
              <div className={styles.messageBubble}>
                {msg.role === "user" ? (
                  <p className={styles.userText}>{msg.text}</p>
                ) : (
                  <div className={styles.aiText}>
                    {renderAnswer(msg.text)}
                    {msg.heritageItems?.length > 0 && (
                      <div className={styles.heritageBox}>
                        <p className={styles.heritageTitle}>{t.heritageTitle}</p>
                        {msg.heritageItems.map((h, j) => (
                          <div key={j} className={styles.heritageItem}>
                            <span className={styles.heritageName}>{h.name}</span>
                            {h.location && (
                              <span className={styles.heritageLocation}>{h.location}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.usedData && (
                      <p className={styles.dataNote}>{t.dataNote}</p>
                    )}
                  </div>
                )}
                <span className={styles.messageTime}>
                  {msg.time?.toLocaleTimeString(lang === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.message} ${styles.aiMessage}`}>
              <div className={styles.aiAvatar}>史</div>
              <div className={styles.messageBubble}>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
                <p className={styles.typingLabel}>{t.typing}</p>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrap}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t.placeholder(era, category)}
              rows={2}
              disabled={loading}
            />
            <button
              className={`${styles.sendBtn} ${loading ? styles.sendBtnLoading : ""}`}
              onClick={() => handleSubmit()}
              disabled={loading || !question.trim()}
            >
              {loading ? <span className={styles.spinner} /> : t.sendBtn}
            </button>
          </div>
          <p className={styles.inputHint}>{t.hint}</p>
        </div>
      </main>
    </div>
  );
}
