import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ════════ CREDENCIALES DIRECTAS ════════
const SUPABASE_URL = "https://ydcbwzsttxpixgcbdupu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J3enN0dHhwaXhnY2JkdXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NzU5MzYsImV4cCI6MjA5OTA1MTkzNn0.zgZ4VfW_LBdHpO47S1ra2k7g21f_1FwUCpvcdqKJ11o";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PALETTE = ["#e8453c", "#1368ce", "#d89e00", "#26890c"];

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
  else if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1]?.split("&")[0];
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : "";
};

// ════════════════════════════════════════════════════════════════════
//  1. PANTALLA PÚBLICA (Proyector Limpio)
// ════════════════════════════════════════════════════════════════════
function PublicProyector() {
  const [livePres, setLivePres] = useState(null);
  const [activeBlocks, setActiveBlocks] = useState([]);

  useEffect(() => {
    fetchLivePresentation();
    const presSub = supabase.channel("public-pres-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "presentations" }, (payload) => {
        if (payload.new.is_live) { setLivePres(payload.new); fetchBlocks(payload.new.id); }
        else { setLivePres(prev => (prev?.id === payload.new.id ? null : prev)); }
      }).subscribe();
    return () => supabase.removeChannel(presSub);
  }, []);

  const fetchLivePresentation = async () => {
    const { data } = await supabase.from("presentations").select("*").eq("is_live", true).single();
    if (data) { setLivePres(data); fetchBlocks(data.id); }
  };

  const fetchBlocks = async (presId) => {
    const { data } = await supabase.from("blocks").select("*").eq("presentation_id", presId).eq("status", "ingresado").order("sort_order", { ascending: true });
    setActiveBlocks(data || []);
  };

  if (!livePres) {
    return (
      <div style={{ ...styles.centerWrap, position: "relative", padding: 0, overflow: "hidden" }}>
        <video autoPlay loop muted playsInline style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}>
          <source src="https://ydcbwzsttxpixgcbdupu.supabase.co/storage/v1/object/public/recursos/intro.mp4" type="video/mp4" />
        </video>
      </div>
    );
  }

  const currentBlock = activeBlocks[livePres.current_block_index];

  return (
    <div style={{ ...styles.centerWrap, overflow: "hidden" }}>
      <AnimatePresence mode="wait">
        {currentBlock ? (
          <motion.div key={currentBlock.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5 }} style={{ width: "90%", maxWidth: 1200, textAlign: "center" }}>
            
            {currentBlock.type === "text" && (
              <>
                <h1 style={{ fontSize: 64, color: "#ffcb2d", marginBottom: 40 }}>{currentBlock.content.title}</h1>
                <p style={{ fontSize: 36, lineHeight: "1.6", whiteSpace: "pre-wrap", textAlign: "left", background: "rgba(255,255,255,0.05)", padding: 40, borderRadius: 20 }}>
                  {currentBlock.content.body}
                </p>
              </>
            )}

            {currentBlock.type === "video" && (
              <>
                <h1 style={{ fontSize: 40, marginBottom: 20 }}>🎬 Video Ilustrativo</h1>
                <div style={{ width: "100%", height: "65vh", background: "#000", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                  {getYouTubeEmbedUrl(currentBlock.content.url) ? (
                    <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(currentBlock.content.url)} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5 }}>URL de video inválida o no configurada</div>
                  )}
                </div>
              </>
            )}

            {currentBlock.type === "quiz" && (
              <>
                <h1 style={{ fontSize: 50, marginBottom: 40, color: "#ffcb2d" }}>🎮 ¡Pregunta de Trivia!</h1>
                <h2 style={{ fontSize: 40, marginBottom: 50 }}>{currentBlock.content.q}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {currentBlock.content.options?.map((opt, i) => (
                    <div key={i} style={{ ...styles.adminCard, background: PALETTE[i], padding: 30, fontSize: 32, fontWeight: "bold" }}>{opt}</div>
                  ))}
                </div>
              </>
            )}

            {currentBlock.type === "qna" && (
              <>
                <h1 style={{ fontSize: 60, color: "#c9a8ff", marginBottom: 20 }}>💬 Preguntas y Respuestas</h1>
                <p style={{ fontSize: 32, opacity: 0.8 }}>Abre la aplicación en tu celular y envíanos tus consultas.</p>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 48 }}>Fin de la presentación</h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  2. PANTALLA DE ADMINISTRACIÓN (El "Director de TV")
// ════════════════════════════════════════════════════════════════════
function AdminExpositor() {
  const [pin, setPin] = useState("");
  const [presentation, setPresentation] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [editingBlock, setEditingBlock] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from("presentations").select("*").eq("pin", pin).single();
    if (data) { setPresentation(data); loadBlocks(data.id); } else alert("PIN incorrecto");
  };

  const loadBlocks = async (presId) => {
    const { data } = await supabase.from("blocks").select("*").eq("presentation_id", presId).order("sort_order", { ascending: true });
    setBlocks(data || []);
  };

  useEffect(() => {
    if (!presentation?.id) return;
    const adminSub = supabase.channel("admin-pres-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "presentations", filter: `id=eq.${presentation.id}` }, (payload) => { 
        setPresentation(payload.new); 
      }).subscribe();
    return () => supabase.removeChannel(adminSub);
  }, [presentation?.id]);

  const addBlock = async (type) => {
    if (editingBlock) { alert("Guarda o cancela la diapositiva actual antes de crear una nueva."); return; }
    let defaultContent = {};
    if (type === "text") defaultContent = { title: "Nuevo Título", body: "Escribe aquí tu contenido..." };
    if (type === "video") defaultContent = { url: "" };
    if (type === "quiz") defaultContent = { q: "Escribe tu pregunta...", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"], correct: 0 };
    if (type === "qna") defaultContent = { title: "Espacio de Preguntas" };

    const newSortOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.sort_order)) + 1 : 0;
    const { data } = await supabase.from("blocks").insert({ presentation_id: presentation.id, type, content: defaultContent, status: "pendiente", sort_order: newSortOrder }).select().single();
    if (data) { setBlocks([...blocks, data]); setEditingBlock(data); }
  };

  const saveBlockEdits = async () => {
    await supabase.from("blocks").update({ content: editingBlock.content, status: "ingresado" }).eq("id", editingBlock.id);
    setEditingBlock(null); loadBlocks(presentation.id);
  };

  const deleteBlock = async (blockId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta diapositiva?")) return;
    await supabase.from("blocks").delete().eq("id", blockId);
    setEditingBlock(null); loadBlocks(presentation.id);
  };

  const projectBlock = async (blockId) => {
    await supabase.from("presentations").update({ is_live: false }).neq("id", presentation.id);
    const publicBlocks = blocks.filter(b => b.status === "ingresado");
    const targetIndex = publicBlocks.findIndex(b => b.id === blockId);
    
    if (targetIndex !== -1) {
      await supabase.from("presentations").update({ is_live: true, current_block_index: targetIndex }).eq("id", presentation.id);
      if (!presentation.is_live) confetti({ particleCount: 150, spread: 80 }); 
    }
  };

  const stopProjection = async () => {
    await supabase.from("presentations").update({ is_live: false }).eq("id", presentation.id);
  };

  const saveTitle = async () => {
    if (tempTitle.trim() !== "" && tempTitle !== presentation.title) {
      setPresentation({ ...presentation, title: tempTitle }); 
      await supabase.from("presentations").update({ title: tempTitle }).eq("id", presentation.id);
    }
    setIsEditingTitle(false);
  };

  if (!presentation) {
    return (
      <div style={styles.centerWrap}>
        <div style={styles.adminCard}>
          <h2 style={styles.panelTitle}>Control de Mando</h2>
          <form onSubmit={handleLogin} style={styles.formGroup}>
            <input type="text" maxLength={4} placeholder="PIN 4 dígitos" value={pin} onChange={(e) => setPin(e.target.value)} style={styles.adminInput}/>
            <button type="submit" style={styles.primaryBtn}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboardLayout}>
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarHeader}>Tus Diapositivas</h3>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {blocks.map((b, i) => {
            const isReady = b.status === "ingresado";
            const publicIndex = blocks.filter(x => x.status === "ingresado").findIndex(x => x.id === b.id);
            const isCurrentlyProjected = presentation.is_live && publicIndex === presentation.current_block_index;

            return (
              <div key={b.id} style={{ ...styles.blockRow, borderLeft: editingBlock?.id === b.id ? "4px solid #ffaa00" : (isCurrentlyProjected ? "4px solid #80ff66" : "4px solid transparent") }}>
                <div onClick={() => setEditingBlock(b)} style={{ flex: 1, cursor: "pointer" }}>
                  <span style={styles.rowOrder}>{i + 1}</span>
                  <p style={styles.rowType}>{b.type.toUpperCase()}</p>
                  <p style={{ fontSize: 11, opacity: 0.6 }}>{isReady ? "✅ Listo" : "⏳ Borrador"}</p>
                </div>
                
                {isReady && (
                  <button 
                    onClick={() => projectBlock(b.id)} 
                    style={{ ...styles.liveBtn, background: isCurrentlyProjected ? "rgba(128, 255, 102, 0.1)" : "#26890c", border: isCurrentlyProjected ? "1px solid #80ff66" : "1px solid transparent", color: isCurrentlyProjected ? "#80ff66" : "#fff", padding: "8px", fontSize: 12 }}
                  >
                    {isCurrentlyProjected ? "🟢 En Pantalla" : "👁️ Proyectar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: "#c9a8ff", fontWeight: 700, marginTop: 20, marginBottom: 8 }}>+ Agregar Bloque:</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => addBlock("text")} style={styles.addBtn} disabled={!!editingBlock}>📄 Texto</button>
          <button onClick={() => addBlock("video")} style={styles.addBtn} disabled={!!editingBlock}>🎬 Video</button>
          <button onClick={() => addBlock("quiz")} style={styles.addBtn} disabled={!!editingBlock}>🎮 Quiz</button>
          <button onClick={() => addBlock("qna")} style={styles.addBtn} disabled={!!editingBlock}>💬 Q&A</button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.dashboardHeader}>
          {isEditingTitle ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} style={{ ...styles.adminInput, width: "350px", fontSize: 24, fontWeight: "bold", padding: "8px 16px" }} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveTitle()} />
              <button onClick={saveTitle} style={{ ...styles.primaryBtn, padding: "10px 15px", fontSize: 14 }}>Guardar</button>
              <button onClick={() => setIsEditingTitle(false)} style={{ ...styles.cancelBtn, padding: "10px 15px", fontSize: 14 }}>Cancelar</button>
            </div>
          ) : (
            <h1 onClick={() => { setTempTitle(presentation.title); setIsEditingTitle(true); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "opacity 0.2s" }} title="Haz clic para editar el título" onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
              {presentation.title} <span style={{ fontSize: 20, opacity: 0.5 }}>✏️</span>
            </h1>
          )}
          
          {presentation.is_live ? (
            <div style={{ display: "flex", gap: 15, alignItems: "center", background: "rgba(38, 137, 12, 0.15)", padding: "10px 20px", borderRadius: 12, border: "1px solid #26890c" }}>
              <span style={{ color: "#80ff66", fontWeight: "bold" }}>🟢 PROYECTANDO AL PÚBLICO</span>
              <button onClick={stopProjection} style={{...styles.cancelBtn, padding: "8px 16px", fontSize: 14}}>⏹️ Apagar Proyector</button>
            </div>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: "bold", padding: "10px 20px", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12 }}>⚪️ Proyector Apagado (Sala de Espera)</span>
          )}
        </div>

        {editingBlock ? (
          <div style={styles.editorCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#ffcb2d" }}>Editar Diapositiva ({editingBlock.type.toUpperCase()})</h2>
              <button onClick={() => deleteBlock(editingBlock.id)} style={styles.deleteBtn}>🗑️ Eliminar</button>
            </div>
            
            {editingBlock.type === "text" && (
              <div style={styles.formGroup}>
                <label style={{ fontSize: 14, fontWeight: "bold", opacity: 0.8 }}>Título Principal:</label>
                <input type="text" value={editingBlock.content.title || ""} onChange={(e) => setEditingBlock({...editingBlock, content: { ...editingBlock.content, title: e.target.value }})} style={styles.adminInput} />
                <label style={{ fontSize: 14, fontWeight: "bold", opacity: 0.8, marginTop: 10 }}>Cuerpo de Texto:</label>
                <textarea rows="6" value={editingBlock.content.body || ""} onChange={(e) => setEditingBlock({...editingBlock, content: { ...editingBlock.content, body: e.target.value }})} style={{...styles.adminInput, resize: "vertical"}} />
              </div>
            )}
            
            {editingBlock.type === "video" && (
              <div style={styles.formGroup}>
                <label style={{ fontSize: 14, fontWeight: "bold", opacity: 0.8 }}>Enlace de YouTube:</label>
                <input type="text" placeholder="Ej: https://www.youtube.com/watch?v=..." value={editingBlock.content.url || ""} onChange={(e) => setEditingBlock({...editingBlock, content: { ...editingBlock.content, url: e.target.value }})} style={styles.adminInput} />
                {getYouTubeEmbedUrl(editingBlock.content.url) && (
                  <div style={{ marginTop: 10, padding: 15, background: "rgba(38, 137, 12, 0.2)", borderRadius: 10, color: "#80ff66", fontSize: 14 }}>✅ Enlace válido y listo para proyectarse.</div>
                )}
              </div>
            )}

            {editingBlock.type === "quiz" && (
              <div style={styles.formGroup}>
                <label style={{ fontSize: 14, fontWeight: "bold", opacity: 0.8 }}>Pregunta de Trivia:</label>
                <input type="text" value={editingBlock.content.q || ""} onChange={(e) => setEditingBlock({...editingBlock, content: { ...editingBlock.content, q: e.target.value }})} style={styles.adminInput} />
                
                <label style={{ fontSize: 14, fontWeight: "bold", opacity: 0.8, marginTop: 10 }}>Opciones de Respuesta (Marca la correcta):</label>
                {editingBlock.content.options?.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", background: editingBlock.content.correct === i ? "rgba(255, 255, 255, 0.1)" : "transparent", padding: "8px", borderRadius: "12px" }}>
                    <input type="radio" name="correctAnswer" checked={editingBlock.content.correct === i} onChange={() => setEditingBlock({...editingBlock, content: { ...editingBlock.content, correct: i }})} style={{ width: 24, height: 24, cursor: "pointer", accentColor: PALETTE[i] }} title="Marcar como respuesta correcta" />
                    <div style={{ background: PALETTE[i], width: 12, height: 38, borderRadius: 6 }}></div>
                    <input type="text" value={opt} onChange={(e) => { const nuevasOpciones = [...editingBlock.content.options]; nuevasOpciones[i] = e.target.value; setEditingBlock({...editingBlock, content: { ...editingBlock.content, options: nuevasOpciones }}); }} style={{...styles.adminInput, flex: 1}} />
                  </div>
                ))}
              </div>
            )}

            {editingBlock.type === "qna" && (
              <p style={{ opacity: 0.7, padding: 20 }}>Este bloque abrirá una pantalla de envío de preguntas en el celular del público.</p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
              <button onClick={saveBlockEdits} style={styles.primaryBtn}>💾 Guardar y Activar Diapositiva</button>
              <button onClick={() => setEditingBlock(null)} style={styles.cancelBtn}>Cancelar / Cerrar</button>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <h2>Panel del Expositor</h2>
            <p>1. Crea diapositivas en el menú de la izquierda.<br/>2. Edítalas y guárdalas.<br/>3. Presiona "👁️ Proyectar" para enviarlas directamente a la pantalla del público.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  3. PANTALLA MÓVIL (Audiencia - CON ALARMA DE ERRORES)
// ════════════════════════════════════════════════════════════════════
function AudienceMobile() {
  const [livePres, setLivePres] = useState(null);
  const [activeBlocks, setActiveBlocks] = useState([]);
  
  const [qnaText, setQnaText] = useState("");
  const [submittedBlocks, setSubmittedBlocks] = useState({});

  useEffect(() => {
    fetchLivePresentation();
    const sub = supabase.channel("mobile-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "presentations" }, (payload) => {
        if (payload.new.is_live) { 
          setLivePres(payload.new); 
          fetchBlocks(payload.new.id); 
        } else { 
          setLivePres(null); 
          setActiveBlocks([]);
        }
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchLivePresentation = async () => {
    const { data } = await supabase.from("presentations").select("*").eq("is_live", true).single();
    if (data) { setLivePres(data); fetchBlocks(data.id); }
  };

  const fetchBlocks = async (presId) => {
    const { data } = await supabase.from("blocks").select("*").eq("presentation_id", presId).eq("status", "ingresado").order("sort_order", { ascending: true });
    setActiveBlocks(data || []);
  };

  // --- LA FUNCIÓN CON ALARMA INTEGRADA ---
  const sendResponse = async (block, type, content) => {
    if (!content && type === "qna") return; 
    
    const { error } = await supabase.from("responses").insert({
      presentation_id: livePres.id,
      block_id: block.id,
      type: type,
      content: String(content)
    });

    // ¡Si el guardia de seguridad u otra cosa bloquea el mensaje, lo veremos aquí!
    if (error) {
      alert("🚨 Error de base de datos: " + error.message);
      return; 
    }

    setSubmittedBlocks(prev => ({ ...prev, [block.id]: true }));
    setQnaText(""); 
  };

  if (!livePres) {
    return (
      <div style={styles.centerWrap}>
        <div style={{ textAlign: "center", padding: 20 }}>
          <h2 style={{ fontSize: 32, color: "#ffcb2d", marginBottom: 15 }}>Buscando charla... 👀</h2>
          <p style={{ opacity: 0.7, fontSize: 18 }}>Por favor, espera a que el expositor inicie la presentación.</p>
        </div>
      </div>
    );
  }

  const currentBlock = activeBlocks[livePres.current_block_index];

  if (!currentBlock || currentBlock.type === "text" || currentBlock.type === "video") {
    return (
      <div style={styles.centerWrap}>
        <div style={{ textAlign: "center", padding: 20 }}>
          <h3 style={{ color: "#c9a8ff", fontSize: 28, marginBottom: 15 }}>Conectado a la charla</h3>
          <p style={{ fontSize: 20 }}>👀 Por favor, presta atención a la pantalla principal.</p>
        </div>
      </div>
    );
  }

  if (submittedBlocks[currentBlock.id]) {
    return (
      <div style={styles.centerWrap}>
        <div style={{ textAlign: "center", padding: 20 }}>
          <h2 style={{ fontSize: 50, marginBottom: 20 }}>✅</h2>
          <h3 style={{ color: "#80ff66", fontSize: 28, marginBottom: 15 }}>¡Enviado con éxito!</h3>
          <p style={{ fontSize: 18, opacity: 0.8 }}>Gracias por tu participación. Atento a la pantalla principal.</p>
        </div>
      </div>
    );
  }

  if (currentBlock.type === "quiz") {
    return (
      <div style={styles.centerWrap}>
        <div style={{ width: "100%", maxWidth: 400, padding: 20, textAlign: "center" }}>
          <h2 style={{ color: "#ffcb2d", fontSize: 28, marginBottom: 30 }}>¡Tu turno de votar!</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {currentBlock.content.options?.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => sendResponse(currentBlock, "quiz", i)}
                style={{ ...styles.primaryBtn, background: PALETTE[i], color: "#fff", fontSize: 20, padding: "20px", borderRadius: 16, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentBlock.type === "qna") {
    return (
      <div style={styles.centerWrap}>
        <div style={{ width: "100%", maxWidth: 400, padding: 20 }}>
          <h2 style={{ color: "#c9a8ff", fontSize: 28, marginBottom: 20, textAlign: "center" }}>Envía tu consulta</h2>
          <textarea 
            value={qnaText}
            onChange={(e) => setQnaText(e.target.value)}
            placeholder="Escribe tu pregunta para el expositor aquí..." 
            style={{ ...styles.adminInput, minHeight: 120, resize: "vertical", marginBottom: 20 }} 
          />
          <button 
            onClick={() => sendResponse(currentBlock, "qna", qnaText)} 
            style={{ ...styles.primaryBtn, width: "100%", opacity: qnaText.trim() === "" ? 0.5 : 1 }}
            disabled={qnaText.trim() === ""} 
          >
            Enviar Pregunta
          </button>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/en-vivo" element={<PublicProyector />} />
        <Route path="/admin" element={<AdminExpositor />} />
        <Route path="/join" element={<AudienceMobile />} />
        <Route path="*" element={<PublicProyector />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  centerWrap: { fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "radial-gradient(circle at 20% 10%,#3a1078,#1a0938 55%,#0d0420)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  adminCard: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: 40, maxWidth: 420, width: "100%" },
  panelTitle: { fontSize: 32, fontWeight: 800, marginBottom: 24 },
  formGroup: { display: "flex", flexDirection: "column", gap: 16 },
  adminInput: { width: "100%", padding: "14px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 16, fontFamily: "inherit", outline: "none" },
  primaryBtn: { padding: "14px 24px", borderRadius: 12, background: "linear-gradient(135deg,#ffcb2d,#ff8a00)", color: "#3a1078", fontSize: 16, fontWeight: 800, cursor: "pointer", border: "none" },
  cancelBtn: { padding: "14px 24px", borderRadius: 12, background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", border: "none" },
  deleteBtn: { padding: "10px 16px", borderRadius: 8, background: "rgba(232, 69, 60, 0.15)", color: "#ff827a", border: "1px solid rgba(232, 69, 60, 0.4)", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  dashboardLayout: { fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "#0d0420", color: "#fff", display: "grid", gridTemplateColumns: "320px 1fr" },
  sidebar: { background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.08)", padding: 24, display: "flex", flexDirection: "column" },
  sidebarHeader: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#c9a8ff" },
  blockRow: { display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.08)", marginBottom: 8 },
  rowOrder: { fontSize: 18, fontWeight: 800, opacity: 0.4 },
  rowType: { fontSize: 14, fontWeight: 700 },
  addBtn: { padding: "10px", background: "rgba(255,255,255,0.06)", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", textAlign: "left" },
  mainContent: { padding: 40, display: "flex", flexDirection: "column", gap: 24, height: "100vh", overflowY: "auto" },
  dashboardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20 },
  liveBtn: { borderRadius: 8, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" },
  editorCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 },
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "rgba(255,255,255,0.4)" }
};