let rankingChart = null;
let hourChart = null;

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

/* RELOGIO */

function atualizarRelogio() {

  const agora = new Date();

  document.getElementById('clock').innerText =
    agora.toLocaleTimeString('pt-BR');

  document.getElementById('date').innerText =
    agora.toLocaleDateString('pt-BR');

}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();

/* CSV */

Papa.parse('./produtividade.csv', {

  download: true,
  header: true,
  delimiter: ';',
  skipEmptyLines: true,

  complete: function(results) {

    const dados = results.data;

    const pontos = {};
    const tempoTrabalhado = {};
    const horas = {
      '09h': 0,'10h': 0,'11h': 0,'12h': 0,'13h': 0,
      '14h': 0,'15h': 0,'16h': 0,'17h': 0,'18h': 0
    };

    dados.forEach(item => {

      const colunas = Object.keys(item);

      const dataHora = item[colunas[0]]; // COLUNA A
      let nome = item[colunas[1]];       // COLUNA B

      if (!nome || !dataHora) return;

      nome = String(nome).trim();

      if (!pontos[nome]) {
        pontos[nome] = [];
      }

      // pega apenas HH:MM
      const partes = String(dataHora).split(' ');

      if (partes.length > 1) {
        const horaCompleta = partes[1].substring(0, 5);
        pontos[nome].push(horaCompleta);

        // gráfico por hora (mantido)
        const hora = horaCompleta.substring(0, 2) + 'h';
        if (horas[hora] !== undefined) {
          horas[hora]++;
        }
      }

    });

    /* =========================
       CALCULAR HORAS TRABALHADAS
    ========================== */

    function converterMinutos(horaStr) {
      const [h, m] = horaStr.split(":").map(Number);
      return h * 60 + m;
    }

    Object.keys(pontos).forEach(nome => {

      const lista = pontos[nome].sort();
      let total = 0;

      for (let i = 0; i < lista.length; i += 2) {

        const entrada = converterMinutos(lista[i]);
        const saida = converterMinutos(lista[i + 1]);

        if (!isNaN(entrada) && !isNaN(saida)) {
          total += (saida - entrada);
        }

      }

      tempoTrabalhado[nome] = total / 60;

    });

    /* RANKING */

    const ranking =
      Object.entries(tempoTrabalhado)
        .map(([nome, total]) => ({
          nome,
          total: Number(total.toFixed(2))
        }))
        .sort((a, b) => b.total - a.total);

    /* KPI */

    document.getElementById('kpiTotal').innerText =
      ranking.reduce((acc, item) => acc + item.total, 0).toFixed(2);

    document.getElementById('kpiTop').innerText =
      ranking[0]?.nome || '-';

    document.getElementById('kpiMedia').innerText =
      (ranking.reduce((acc, item) => acc + item.total, 0) / ranking.length).toFixed(2);

    document.getElementById('kpiRuim').innerText =
      ranking.filter(item => item.total < 4).length;

    /* TABELA */

    const tabela = document.getElementById('tabelaColaboradores');
    tabela.innerHTML = '';

    ranking.forEach(item => {

      let status = 'Médio';
      let classe = 'medio';

      if (item.total > 8) {
        status = 'Excelente';
        classe = 'excelente';
      } else if (item.total > 6) {
        status = 'Bom';
        classe = 'bom';
      } else if (item.total < 4) {
        status = 'Ruim';
        classe = 'ruim';
      }

      tabela.innerHTML += `
        <tr>
          <td>${item.nome}</td>
          <td>${item.total.toFixed(2)}h</td>
          <td>
            <span class="status ${classe}">
              ${status}
            </span>
          </td>
        </tr>
      `;

    });

    /* CORES GRAFICO */

    const top5 = ranking.slice(0, 5);

    const cores = top5.map(item => {

      if (item.total > 8) return '#166534';
      if (item.total > 6) return '#4ade80';
      if (item.total < 4) return '#dc2626';
      return '#facc15';

    });

    /* RANKING CHART */

    new Chart(
      document.getElementById('rankingChart'),
      {
        type: 'bar',
        data: {
          labels: top5.map(r => r.nome),
          datasets: [{
            label: 'Horas Trabalhadas',
            data: top5.map(r => r.total),
            backgroundColor: cores,
            borderRadius: 14
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                font: { weight: 'bold' }
              }
            }
          }
        }
      }
    );

    /* GRAFICO POR HORA */

    new Chart(
      document.getElementById('hourChart'),
      {
        type: 'line',
        data: {
          labels: Object.keys(horas),
          datasets: [{
            label: 'Registros por Hora',
            data: Object.values(horas),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,.2)',
            fill: true,
            tension: 0.4
          }]
        }
      }
    );

  }

});