import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import logo from './assets/logo.png';

const API = import.meta.env.VITE_API_URL || '/api';
const photos = ['/images/flight-1.jpg', '/images/flight-2.jpg', '/images/flight-3.jpg'];

const empty = { clientName: '', birthday: '', flightDate: '', from: 'ECUADOR PARAPENTE', message: '' };
const dateText = (date) => date ? new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)) : 'la fecha acordada';
const defaultMessage = (data) => `Ecuador Parapente te invita a acercarte el ${dateText(data.flightDate)} para disfrutar un vuelo en parapente. Este cupón es válido para un vuelo en Montañita.`;
const displayMessage = (data) => data.message.trim() || defaultMessage(data);

function GiftCard({ data, final = false }) {
  const birthday = Boolean(data.birthday);
  return <article className={`gift-card ${birthday ? 'birthday' : ''}`}>
    <div className="card-sky"><span className="cloud cloud-a"/><span className="cloud cloud-b"/><span className="glider">◢</span></div>
    <header><img src={logo} alt="Ecuador Parapente"/><div className="voucher">VALE DE REGALO<br/><strong>PARAPENTE</strong></div></header>
    <section className="card-main">
      <p className="eyebrow">UNA AVENTURA SOBRE EL PACÍFICO</p>
      <h1>{birthday ? '¡Feliz cumpleaños!' : '¡Tu próxima aventura te espera!'}</h1>
      <p className="recipient">Para: <strong>{data.clientName || 'Nombre del aventurero'}</strong></p>
      <p className="message">{displayMessage(data)}</p>
      <div className="flight-data"><div><span>FECHA DEL VUELO</span><strong>{data.flightDate ? dateText(data.flightDate) : 'Por confirmar'}</strong></div><div><span>LUGAR</span><strong>Montañita · Ecuador</strong></div></div>
    </section>
    <div className="gallery">{photos.map((photo, index) => <img key={photo} src={photo} alt={`Vuelo en parapente ${index + 1}`} />)}</div>
    <footer><span>De parte de <strong>{data.from || 'ECUADOR PARAPENTE'}</strong></span><span className="boarding">✦ AVENTURA INCLUIDA ✦</span></footer>
    {birthday && <div className="confetti" aria-hidden="true">✦ • ✧ ★ • ✦</div>}
    {final && <p className="final-note">Presenta esta invitación al llegar. ¡Nos vemos en el cielo!</p>}
  </article>;
}

function Admin() {
  const [data, setData] = useState(empty); const [status, setStatus] = useState('');
  const update = e => setData(v => ({ ...v, [e.target.name]: e.target.value }));
  const create = async e => { e.preventDefault(); setStatus('Generando enlace…');
    try { const r = await fetch(`${API}/invitations`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); const body = await r.json(); if (!r.ok) throw new Error(body.error || 'No se pudo crear la invitación');
      await navigator.clipboard?.writeText(body.invitationUrl); setStatus(`¡Lista! Enlace copiado: ${body.invitationUrl}`);
    } catch (err) { setStatus(err.message); }
  };
  return <main className="admin-page"><section className="intro"><img src={logo} alt="Ecuador Parapente"/><p>Panel de invitaciones</p><h2>Regala una vista<br/>que nunca olvidarán.</h2><p className="muted">Personaliza y envía una experiencia de vuelo inolvidable.</p></section><section className="workspace"><form onSubmit={create}><div className="form-heading"><span>01</span><div><p>DETALLES DE LA INVITACIÓN</p><h2>Crea un vale de regalo</h2></div></div><label>Nombre del cliente<input required name="clientName" value={data.clientName} onChange={update} placeholder="Ej. María López" /></label><div className="two-columns"><label>Fecha de cumpleaños <small>(opcional)</small><input type="date" name="birthday" value={data.birthday} onChange={update}/></label><label>Fecha del vuelo<input required type="date" name="flightDate" value={data.flightDate} onChange={update}/></label></div><label>De parte de<input name="from" value={data.from} onChange={update}/></label><label>Mensaje especial <small>(opcional)</small><textarea name="message" value={data.message} onChange={update} placeholder="Se usará el mensaje predeterminado si lo dejas vacío." rows="4"/></label><button type="submit">Generar invitación <span>→</span></button>{status && <p className="status">{status}</p>}</form><div className="preview"><p>VISTA PREVIA EN VIVO</p><GiftCard data={data}/></div></section></main>;
}

function PublicInvitation({ code }) {
  const [state, setState] = useState({ loading:true, data:null, error:'' });
  useEffect(() => { fetch(`${API}/invitations/${encodeURIComponent(code)}`).then(r => r.ok ? r.json() : Promise.reject()).then(data => setState({loading:false,data,error:''})).catch(() => setState({loading:false,data:null,error:'Esta invitación no existe o ya no está disponible.'})); }, [code]);
  if (state.loading) return <div className="center">Cargando tu aventura…</div>;
  if (state.error) return <div className="center"><h1>Invitación no encontrada</h1><p>{state.error}</p></div>;
  return <main className="public-page"><GiftCard data={state.data} final/><p className="public-brand">ECUADOR PARAPENTE · Montañita, Ecuador</p></main>;
}
function App() { const match = location.pathname.match(/^\/invitacion\/([^/]+)$/); return match ? <PublicInvitation code={match[1]}/> : <Admin/>; }
createRoot(document.getElementById('root')).render(<App/>);
