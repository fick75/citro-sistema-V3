import { useState, useRef } from "react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

const TIPOS_DOC = [
  "Constancia de Grado Académico",
  "Curriculum Vitae",
  "Publicación / Artículo",
  "Proyecto de Investigación",
  "Material Didáctico",
  "Certificación / Diplomado",
  "Evaluación Docente",
  "Informe de Actividades",
  "Otro",
];

const DEPARTAMENTOS = [
  "Ciencias Exactas e Ingeniería",
  "Ciencias Sociales y Humanidades",
  "Ciencias de la Salud",
  "Educación y Pedagogía",
  "Artes y Cultura",
  "Administración y Economía",
  "Investigación y Posgrado",
];

const initialForm = {
  nombre: "",
  apellidos: "",
  noEmpleado: "",
  correo: "",
  telefono: "",
  departamento: "",
  tipoDocumento: "",
  cicloEscolar: "",
  descripcion: "",
  archivos: [],
};

export default function FormularioAcademicos() {
  const [form, setForm] = useState(initialForm);
  const [submissions, setSubmissions] = useState([]);
  const [view, setView] = useState("form"); // form | carpetas | excel
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellidos.trim()) e.apellidos = "Requerido";
    if (!form.noEmpleado.trim()) e.noEmpleado = "Requerido";
    if (!form.correo.trim() || !/\S+@\S+\.\S+/.test(form.correo)) e.correo = "Correo inválido";
    if (!form.departamento) e.departamento = "Requerido";
    if (!form.tipoDocumento) e.tipoDocumento = "Requerido";
    if (!form.cicloEscolar.trim()) e.cicloEscolar = "Requerido";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setForm((f) => ({ ...f, archivos: [...f.archivos, ...files] }));
  };

  const removeFile = (i) => {
    setForm((f) => ({ ...f, archivos: f.archivos.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const entry = {
      ...form,
      id: Date.now(),
      fecha: new Date().toLocaleDateString("es-MX"),
      hora: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      carpeta: `${form.cicloEscolar}/${form.departamento}/${form.tipoDocumento}/${form.apellidos}_${form.nombre}`,
    };
    setSubmissions((s) => [...s, entry]);
    setSubmitted(true);
    setTimeout(() => {
      setForm(initialForm);
      setSubmitted(false);
    }, 3500);
  };

  // Build folder tree
  const carpetaTree = submissions.reduce((tree, s) => {
    const parts = s.carpeta.split("/");
    let node = tree;
    parts.forEach((p, i) => {
      if (!node[p]) node[p] = i === parts.length - 1 ? { _files: [] } : {};
      node = node[p];
    });
    node._files = [...(node._files || []), ...s.archivos];
    return tree;
  }, {});

  const exportExcel = () => {
    const rows = submissions.map((s) => ({
      "N° Registro": s.id,
      "Fecha": s.fecha,
      "Hora": s.hora,
      "Nombre": s.nombre,
      "Apellidos": s.apellidos,
      "No. Empleado": s.noEmpleado,
      "Correo": s.correo,
      "Teléfono": s.telefono,
      "Departamento": s.departamento,
      "Tipo de Documento": s.tipoDocumento,
      "Ciclo Escolar": s.cicloEscolar,
      "Descripción": s.descripcion,
      "Archivos Adjuntos": s.archivos.map((a) => a.name).join(", "),
      "Ruta de Carpeta": s.carpeta,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({
      wch: Math.max(k.length + 2, 18),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registro Académicos");
    XLSX.writeFile(wb, "maestro_academicos.xlsx");
  };

  const FolderNode = ({ node, name, depth = 0 }) => {
    const [open, setOpen] = useState(true);
    const children = Object.entries(node).filter(([k]) => k !== "_files");
    const files = node._files || [];
    return (
      <div style={{ marginLeft: depth * 18 }}>
        <div
          onClick={() => setOpen(!open)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "3px 0", color: depth === 0 ? "#c9a227" : "#cbd5e0", fontWeight: depth < 2 ? 600 : 400, fontSize: 13 + (2 - Math.min(depth, 2)) }}
        >
          <span style={{ fontSize: 14 }}>{open ? "📂" : "📁"}</span> {name}
        </div>
        {open && (
          <>
            {children.map(([k, v]) => (
              <FolderNode key={k} node={v} name={k} depth={depth + 1} />
            ))}
            {files.map((f, i) => (
              <div key={i} style={{ marginLeft: 18, display: "flex", alignItems: "center", gap: 6, color: "#a0aec0", fontSize: 12, padding: "2px 0" }}>
                📄 {f.name} <span style={{ opacity: 0.5 }}>({(f.size / 1024).toFixed(1)} KB)</span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const inputStyle = (err) => ({
    width: "100%", background: "#1a2035", border: `1.5px solid ${err ? "#e53e3e" : "#2d3a5a"}`,
    borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s",
  });

  const labelStyle = { color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" };
  const fieldWrap = { display: "flex", flexDirection: "column", gap: 4 };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1623", fontFamily: "'Georgia', serif", padding: "30px 16px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ maxWidth: 860, margin: "0 auto 28px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg,#c9a227,#f0d06a)", borderRadius: "50%", width: 64, height: 64, lineHeight: "64px", fontSize: 30, marginBottom: 12, boxShadow: "0 4px 20px rgba(201,162,39,0.4)" }}>🎓</div>
        <h1 style={{ color: "#f0d06a", margin: "0 0 6px", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>Sistema de Registro Académico</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>Captura de información y gestión documental</p>
      </div>

      {/* Nav */}
      <div style={{ maxWidth: 860, margin: "0 auto 24px", display: "flex", gap: 8, justifyContent: "center" }}>
        {[["form", "📝 Formulario"], ["carpetas", `📁 Carpetas (${submissions.length})`], ["excel", "📊 Excel Maestro"]].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} style={{ padding: "8px 20px", borderRadius: 24, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: view === k ? "linear-gradient(135deg,#c9a227,#f0d06a)" : "#1a2035", color: view === k ? "#0f1623" : "#94a3b8", transition: "all 0.2s" }}>{label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* FORM VIEW */}
        {view === "form" && (
          <div style={{ background: "#131c2e", borderRadius: 16, border: "1px solid #1e2d4a", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            {/* Gold bar */}
            <div style={{ height: 4, background: "linear-gradient(90deg,#c9a227,#f0d06a,#c9a227)" }} />

            <div style={{ padding: "28px 32px" }}>
              {submitted && (
                <div style={{ background: "#14532d", border: "1px solid #22c55e", borderRadius: 10, padding: "14px 20px", marginBottom: 24, color: "#86efac", textAlign: "center", fontSize: 15 }}>
                  ✅ Registro enviado con éxito. La información ha sido guardada correctamente.
                </div>
              )}

              <h2 style={{ color: "#f0d06a", margin: "0 0 24px", fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1e2d4a", paddingBottom: 12 }}>I. Datos del Académico</h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Nombre(s) *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. María Elena" style={inputStyle(errors.nombre)} />
                  {errors.nombre && <span style={{ color: "#fc8181", fontSize: 11 }}>{errors.nombre}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Apellidos *</label>
                  <input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Ej. García Morales" style={inputStyle(errors.apellidos)} />
                  {errors.apellidos && <span style={{ color: "#fc8181", fontSize: 11 }}>{errors.apellidos}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>No. Empleado *</label>
                  <input name="noEmpleado" value={form.noEmpleado} onChange={handleChange} placeholder="Ej. DOC-00123" style={inputStyle(errors.noEmpleado)} />
                  {errors.noEmpleado && <span style={{ color: "#fc8181", fontSize: 11 }}>{errors.noEmpleado}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Correo Institucional *</label>
                  <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="usuario@institucion.edu.mx" style={inputStyle(errors.correo)} />
                  {errors.correo && <span style={{ color: "#fc8181", fontSize: 11 }}>{errors.correo}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Teléfono / Extensión</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 228-123-4567 ext. 100" style={inputStyle()} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Departamento / Área *</label>
                  <select name="departamento" value={form.departamento} onChange={handleChange} style={inputStyle(errors.departamento)}>
                    <option value="">-- Seleccionar --</option>
                    {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  {errors.departamento && <span style={{ color: "#fc8181", fontSize: 11 }}>{errors.departamento}</span>}
                </div>
              </div>

              <h2 style={{ color: "#f0d06a", margin: "24px 0 16px", fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1e2d4a", paddingBottom: 12 }}>II. Información Documental</h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Tipo de Documento *</label>
                  <select name="tipoDocumento" value={form.tipoDocumento} onChange={handleChange} style={inputStyle(errors.tipoDocumento)}>
                    <option value="">-- Seleccionar --</option>
                    {TIPOS_DOC.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  {errors.tipoDocumento && <span style={{ color: "#fc8181", fontSize: 11 }}>{errors.tipoDocumento}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Ciclo Escolar *</label>
                  <input name="cicloEscolar" value={form.cicloEscolar} onChange={handleChange} placeholder="Ej. 2025-A" style={inputStyle(errors.cicloEscolar)} />
                  {errors.cicloEscolar && <span style={{ color: "#fc8181", fontSize: 11 }}>{errors.cicloEscolar}</span>}
                </div>
              </div>

              <div style={{ ...fieldWrap, marginBottom: 20 }}>
                <label style={labelStyle}>Descripción / Observaciones</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} placeholder="Descripción breve del documento o comentarios adicionales…" style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.5 }} />
              </div>

              <h2 style={{ color: "#f0d06a", margin: "0 0 16px", fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1e2d4a", paddingBottom: 12 }}>III. Documentos Adjuntos</h2>

              {/* Upload area */}
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files).map(f => ({ name: f.name, size: f.size, type: f.type })); setForm(fm => ({ ...fm, archivos: [...fm.archivos, ...files] })); }}
                style={{ border: "2px dashed #2d3a5a", borderRadius: 12, padding: "28px", textAlign: "center", cursor: "pointer", background: "#0f1623", transition: "border-color 0.2s", marginBottom: 16 }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>☁️</div>
                <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>Arrastra archivos aquí o <span style={{ color: "#f0d06a" }}>haz clic para seleccionar</span></p>
                <p style={{ color: "#475569", margin: "4px 0 0", fontSize: 12 }}>PDF, DOCX, XLSX, JPG, PNG (máx. 25 MB por archivo)</p>
              </div>
              <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />

              {form.archivos.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {form.archivos.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#1a2035", borderRadius: 8, padding: "8px 14px" }}>
                      <span style={{ fontSize: 18 }}>{f.name.endsWith(".pdf") ? "📕" : f.name.endsWith(".docx") ? "📘" : "📄"}</span>
                      <span style={{ flex: 1, color: "#cbd5e0", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      <span style={{ color: "#475569", fontSize: 12 }}>{(f.size / 1024).toFixed(1)} KB</span>
                      <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Folder preview */}
              {form.cicloEscolar && form.departamento && form.tipoDocumento && (
                <div style={{ background: "#0f1623", borderRadius: 10, padding: "14px 18px", marginBottom: 20, border: "1px solid #1e2d4a" }}>
                  <p style={{ color: "#64748b", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>📁 Se guardará en la carpeta:</p>
                  <code style={{ color: "#f0d06a", fontSize: 12 }}>
                    {form.cicloEscolar} / {form.departamento} / {form.tipoDocumento} / {form.apellidos || "Apellidos"}_{form.nombre || "Nombre"}
                  </code>
                </div>
              )}

              <button onClick={handleSubmit} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#c9a227,#f0d06a)", border: "none", borderRadius: 10, color: "#0f1623", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5, boxShadow: "0 4px 20px rgba(201,162,39,0.4)", transition: "opacity 0.2s" }}>
                Enviar Registro ✓
              </button>
            </div>
          </div>
        )}

        {/* CARPETAS VIEW */}
        {view === "carpetas" && (
          <div style={{ background: "#131c2e", borderRadius: 16, border: "1px solid #1e2d4a", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg,#c9a227,#f0d06a,#c9a227)" }} />
            <div style={{ padding: "28px 32px" }}>
              <h2 style={{ color: "#f0d06a", margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>📁 Estructura de Carpetas</h2>
              {submissions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                  <p>Aún no hay registros. Llena el formulario para ver las carpetas organizadas.</p>
                </div>
              ) : (
                <div style={{ fontFamily: "'Courier New', monospace" }}>
                  {Object.entries(carpetaTree).map(([k, v]) => (
                    <FolderNode key={k} node={v} name={k} depth={0} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXCEL VIEW */}
        {view === "excel" && (
          <div style={{ background: "#131c2e", borderRadius: 16, border: "1px solid #1e2d4a", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg,#c9a227,#f0d06a,#c9a227)" }} />
            <div style={{ padding: "28px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h2 style={{ color: "#f0d06a", margin: 0, fontSize: 18, fontWeight: 700 }}>📊 Excel Maestro de Registros</h2>
                {submissions.length > 0 && (
                  <button onClick={exportExcel} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#c9a227,#f0d06a)", border: "none", borderRadius: 8, color: "#0f1623", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    ⬇️ Descargar .xlsx
                  </button>
                )}
              </div>

              {submissions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                  <p>Aún no hay registros para mostrar en el Excel maestro.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#1a2035" }}>
                        {["#", "Fecha", "Nombre Completo", "No. Empl.", "Depto.", "Tipo Doc.", "Ciclo", "Archivos"].map((h) => (
                          <th key={h} style={{ padding: "10px 12px", color: "#f0d06a", textAlign: "left", borderBottom: "1px solid #2d3a5a", whiteSpace: "nowrap", fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s, i) => (
                        <tr key={s.id} style={{ background: i % 2 === 0 ? "#0f1623" : "#131c2e", borderBottom: "1px solid #1e2d4a" }}>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>{i + 1}</td>
                          <td style={{ padding: "8px 12px", color: "#94a3b8", whiteSpace: "nowrap" }}>{s.fecha}</td>
                          <td style={{ padding: "8px 12px", color: "#e2e8f0", fontWeight: 600 }}>{s.apellidos}, {s.nombre}</td>
                          <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{s.noEmpleado}</td>
                          <td style={{ padding: "8px 12px", color: "#94a3b8", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.departamento}</td>
                          <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{s.tipoDocumento}</td>
                          <td style={{ padding: "8px 12px", color: "#f0d06a" }}>{s.cicloEscolar}</td>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>{s.archivos.length} archivo(s)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ color: "#475569", fontSize: 11, margin: "16px 0 0", textAlign: "right" }}>Total: {submissions.length} registro(s) — Descarga el .xlsx para ver todos los campos completos</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
