"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";

const ERAS = ["조선 초기", "조선 중기", "조선 후기", "고려", "삼국시대", "시대 무관"];
const CATEGORIES = ["복식·의복", "관직·제도", "건축·공간", "음식·예절", "무기·전투", "신분·사회", "기타"];

const EXAMPLE_QUESTIONS = [
  "조선 중기 사대부 남성의 일상 복식은 어떻게 묘사하면 되나요?",
  "영의정과 좌의정의 차이와 관복 색상은?",
  "궁궐 내 상궁과 나인의 위계 구조를 설명해주세요",
  "고려시대 무신 장군이 입는 갑옷 종류는?",
  "조선시대 양반가 사랑채와 안채의 구분과 쓰임새는?",
];

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [era, setEra] = useState("조선 중기");
  const [category, setCategory] = useState("복식·의복");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

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
        body: JSON.stringify({ question: q.trim(), era, category }),
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
      setError(e.message || "오류가 발생했습니다.");
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

  // 마크다운 간단 렌더링
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
          <div className={styles.logo}>
            <span className={styles.logoHanja}>朝鮮書齋</span>
            <span className={styles.logoKr}>조선서재</span>
          </div>
          <p className={styles.tagline}>
            AI × 문화재청 공공데이터 기반 역사 웹소설 고증 어시스턴트
          </p>
          <div className={styles.dataBadge}>
            <span className={styles.dot} />
            문화공공데이터광장 연동 중
          </div>
        </div>
        <div className={styles.headerDeco} />
      </header>

      {/* ── 메인 ── */}
      <main className={styles.main}>
        {/* 설정 패널 */}
        <div className={styles.settingsPanel}>
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>시대 설정</label>
            <div className={styles.chips}>
              {ERAS.map((e) => (
                <button
                  key={e}
                  className={`${styles.chip} ${era === e ? styles.chipActive : ""}`}
                  onClick={() => setEra(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>고증 분야</label>
            <div className={styles.chips}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`${styles.chip} ${category === c ? styles.chipActive : ""}`}
                  onClick={() => setCategory(c)}
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
              <h2 className={styles.welcomeTitle}>사관(史官)AI에게 물어보세요</h2>
              <p className={styles.welcomeDesc}>
                역사 웹소설 창작에 필요한 복식, 관직, 건축, 예절 등<br />
                문화재청 공공데이터에 근거한 고증 정보를 제공합니다
              </p>
              <div className={styles.examples}>
                <p className={styles.examplesLabel}>예시 질문</p>
                <div className={styles.exampleList}>
                  {EXAMPLE_QUESTIONS.map((q, i) => (
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
                        <p className={styles.heritageTitle}>
                          📚 문화재청 공공데이터 연동 결과
                        </p>
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
                    {!msg.usedData && (
                      <p className={styles.dataNote}>
                        * API 키 연동 후 문화재청 실시간 데이터가 추가됩니다
                      </p>
                    )}
                  </div>
                )}
                <span className={styles.messageTime}>
                  {msg.time?.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
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
                <p className={styles.typingLabel}>사관AI가 고증 자료를 검토하고 있습니다...</p>
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
              placeholder={`${era} · ${category} 관련 고증 질문을 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)`}
              rows={2}
              disabled={loading}
            />
            <button
              className={`${styles.sendBtn} ${loading ? styles.sendBtnLoading : ""}`}
              onClick={() => handleSubmit()}
              disabled={loading || !question.trim()}
            >
              {loading ? <span className={styles.spinner} /> : "問"}
            </button>
          </div>
          <p className={styles.inputHint}>
            본 서비스는 문화공공데이터광장·문화재청 공공데이터를 활용합니다 |
            제4회 문화체육관광 AI·데이터 활용 공모전 출품작
          </p>
        </div>
      </main>
    </div>
  );
}
