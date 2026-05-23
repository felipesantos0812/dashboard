let rankingChart;
let hourChart;
let mediaHorasChart;

/* =========================
   DARK MODE
========================= */

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

/* =========================
   RELÓGIO
========================= */

function atualizarRelogio() {
  const agora = new Date();

  document.getElementById('clock').innerText =
    agora.toLocaleTimeString('pt-BR');

  document.getElementById('date').innerText =
    agora.toLocaleDateString('pt-BR');
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();

/* =========================
   ABAS
========================= */

function mostrarAba(aba) {

  document.getElementById('aba-dashboard').style.display = 'none';
  document.getElementById('aba-horas').style.display = 'none';

  const el = document.getElementById('aba-' + aba);
  if (el) el.style.display = 'block';
}

/* =========================
   SEGURANÇA HORAS
========================= */

function converterMinutos(horaStr) {

  if (!horaStr || typeof horaStr !== 'string') return NaN;

  const p = horaStr.split(":");

  if (p.length < 2) return NaN;

  const h = Number(p[0]);
  const m = Number(p[1]);

  if (isNaN(h) || isNaN(m)) return NaN;

  return h * 60 + m;
}

/* =========================
   CSV
========================= */

Papa.parse('./produtividade.csv', {

  download: true,
  header: true,
  delimiter: ';',
  skipEmptyLines: true,
  dynamicTyping: false,

  complete: function(results) {

    const dados = results.data;

    const pontos = {};
    const tempo = {};
    const bipados = {};

    const horas = {
      '09h':0,'10h':0,'11h':0,'12h':0,'13h':0,
      '14h':0,'15h':0,'16h':0,'17h':0,'18h':0
    };

    dados.forEach(item => {

      const col = Object.keys(item);

      if (!col || col.length < 2) return;

      const dataHora = item[col[0]];
      let nome = item[col[1]];

      if (!nome || !dataHora) return;

      nome = String(nome).trim();

      /* =====================
         CONTA BIPADOS
      ===================== */
      if (!bipados[nome]) bipados[nome] = 0;
      bipados[nome]++;

      /* =====================
         HORAS
      ===================== */
      if (!pontos[nome]) pontos[nome] = [];

      const partes = String(dataHora).split(' ');

      if (partes.length > 1) {

        const hora = partes[1].substring(0,5);
        pontos[nome].push(hora);

        const hh = hora.substring(0,2) + 'h';
        if (horas[hh] !== undefined) horas[hh]++;

      }

    });

    /* =========================
       CALCULAR HORAS
    ========================== */

    Object.keys(pontos).forEach(nome => {

      const lista = pontos[nome].sort();

      let total = 0;

      for (let i = 0; i < lista.length; i += 2) {

        const e = converterMinutos(lista[i]);
        const s = converterMinutos(lista[i+1]);

        if (!isNaN(e) && !isNaN(s) && s > e) {
          total += (s - e);
        }

      }

      tempo[nome] = total / 60;

    });

    /* =========================
       RANKING FINAL (3 MÉTRICAS)
    ========================== */

    const ranking = Object.keys(tempo).map(nome => {

      const pedidos = bipados[nome] || 0;
      const horasTrabalhadas = tempo[nome] || 0;
      const media = horasTrabalhadas > 0 ? pedidos / horasTrabalhadas : 0;

      return {
        nome,
        pedidos,
        horas: Number(horasTrabalhadas.toFixed(2)),
        media: Number(media.toFixed(2))
      };

    }).sort((a,b)=>b.pedidos-a.pedidos);

    /* =========================
       KPIs
    ========================== */

    document.getElementById('kpiTotal').innerText =
      ranking.reduce((a,b)=>a+b.pedidos,0);

    document.getElementById('kpiTop').innerText =
      ranking[0]?.nome || '-';

    document.getElementById('kpiMedia').innerText =
      (ranking.reduce((a,b)=>a+b.media,0)/ranking.length).toFixed(2);

    document.getElementById('kpiRuim').innerText =
      ranking.filter(i=>i.media < 10).length;

    /* =========================
       TABELA DASHBOARD
    ========================== */

    const tabela = document.getElementById('tabelaColaboradores');
    tabela.innerHTML = '';

    ranking.forEach(i => {

      tabela.innerHTML += `
        <tr>
          <td>${i.nome}</td>
          <td>${i.pedidos}</td>
          <td>${i.horas}h</td>
          <td>${i.media}</td>
        </tr>
      `;

    });

    /* =========================
       TABELA HORAS
    ========================== */

    const tabelaHoras = document.getElementById('tabelaHoras');
    if (tabelaHoras) {
      tabelaHoras.innerHTML = '';

      ranking.forEach(i => {

        tabelaHoras.innerHTML += `
          <tr>
            <td>${i.nome}</td>
            <td>${i.pedidos}</td>
            <td>${i.horas}h</td>
            <td>${i.media}</td>
          </tr>
        `;

      });

    }

    /* =========================
       GRÁFICO TOP
    ========================== */

    if (rankingChart) rankingChart.destroy();

    rankingChart = new Chart(
      document.getElementById('rankingChart'),
      {
        type:'bar',
        data:{
          labels:ranking.slice(0,5).map(i=>i.nome),
          datasets:[{
            data:ranking.slice(0,5).map(i=>i.pedidos),
            backgroundColor:'#2563eb'
          }]
        }
      }
    );

    /* =========================
       GRÁFICO HORAS
    ========================== */

    if (hourChart) hourChart.destroy();

    hourChart = new Chart(
      document.getElementById('hourChart'),
      {
        type:'line',
        data:{
          labels:Object.keys(horas),
          datasets:[{
            data:Object.values(horas),
            borderColor:'#2563eb',
            fill:true
          }]
        }
      }
    );

    /* =========================
       GRÁFICO HORAS TRABALHADAS
    ========================== */

    const ctx = document.getElementById('mediaHorasChart');

    if (ctx) {

      if (mediaHorasChart) mediaHorasChart.destroy();

      mediaHorasChart = new Chart(ctx, {
        type:'bar',
        data:{
          labels:ranking.map(i=>i.nome),
          datasets:[{
            data:ranking.map(i=>i.horas),
            backgroundColor:'#16a34a'
          }]
        }
      });

    }

  }

});