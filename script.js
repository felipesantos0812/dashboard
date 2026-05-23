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
   ABAS (FIX DEFINITIVO)
========================= */

function mostrarAba(aba) {

  const dash = document.getElementById('aba-dashboard');
  const horas = document.getElementById('aba-horas');

  if (!dash || !horas) return;

  dash.style.display = 'none';
  horas.style.display = 'none';

  const target = document.getElementById('aba-' + aba);

  if (target) {
    target.style.display = 'block';
  }
}

/* =========================
   CONVERTER HORAS (FIX)
========================= */

function converterMinutos(horaStr) {

  if (!horaStr || typeof horaStr !== 'string') return NaN;

  const partes = horaStr.split(":");

  if (partes.length < 2) return NaN;

  const h = Number(partes[0]);
  const m = Number(partes[1]);

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
    const tempoTrabalhado = {};

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

      if (!pontos[nome]) {
        pontos[nome] = [];
      }

      const partes = String(dataHora).split(' ');

      if (partes.length > 1) {

        const hora = partes[1].substring(0,5);

        pontos[nome].push(hora);

        const hh = hora.substring(0,2) + 'h';

        if (horas[hh] !== undefined) {
          horas[hh]++;
        }

      }

    });

    /* =========================
       CALCULAR HORAS
    ========================== */

    Object.keys(pontos).forEach(nome => {

      const lista = pontos[nome].sort();

      let total = 0;

      for (let i = 0; i < lista.length; i += 2) {

        const entrada = converterMinutos(lista[i]);
        const saida = converterMinutos(lista[i + 1]);

        if (
          !isNaN(entrada) &&
          !isNaN(saida) &&
          saida > entrada
        ) {
          total += (saida - entrada);
        }

      }

      tempoTrabalhado[nome] = total / 60;

    });

    /* =========================
       RANKING
    ========================== */

    const ranking =
      Object.entries(tempoTrabalhado)
        .map(([nome,total]) => ({
          nome,
          total: Number(total.toFixed(2))
        }))
        .sort((a,b)=>b.total-a.total);

    /* =========================
       KPI
    ========================== */

    document.getElementById('kpiTotal').innerText =
      ranking.reduce((a,b)=>a+b.total,0).toFixed(2);

    document.getElementById('kpiTop').innerText =
      ranking[0]?.nome || '-';

    document.getElementById('kpiMedia').innerText =
      (ranking.reduce((a,b)=>a+b.total,0)/ranking.length).toFixed(2);

    document.getElementById('kpiRuim').innerText =
      ranking.filter(i=>i.total<4).length;

    /* =========================
       TABELA DASHBOARD
    ========================== */

    const tabela = document.getElementById('tabelaColaboradores');
    tabela.innerHTML = '';

    ranking.forEach(i => {

      let status = 'Médio';

      if (i.total > 6) status = 'Bom';
      if (i.total > 8) status = 'Excelente';
      if (i.total < 4) status = 'Ruim';

      tabela.innerHTML += `
        <tr>
          <td>${i.nome}</td>
          <td>${i.total.toFixed(2)}h</td>
          <td>${status}</td>
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
            <td>${i.total.toFixed(2)}h</td>
          </tr>
        `;
      });
    }

    /* =========================
       GRÁFICO RANKING
    ========================== */

    if (rankingChart) rankingChart.destroy();

    rankingChart = new Chart(
      document.getElementById('rankingChart'),
      {
        type:'bar',
        data:{
          labels:ranking.slice(0,5).map(i=>i.nome),
          datasets:[{
            data:ranking.slice(0,5).map(i=>i.total),
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

    const canvas = document.getElementById('mediaHorasChart');

    if (canvas) {

      if (mediaHorasChart) mediaHorasChart.destroy();

      mediaHorasChart = new Chart(canvas, {
        type:'bar',
        data:{
          labels:ranking.map(i=>i.nome),
          datasets:[{
            data:ranking.map(i=>i.total),
            backgroundColor:'#16a34a'
          }]
        }
      });

    }

  }

});