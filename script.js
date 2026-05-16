// Configuração inicial nas coordenadas da Rua João Emílio Ritter (Nova Prata do Iguaçu - PR)
const lat = -25.620417;
const lng = -53.343028;

// Inicializa o mapa focado na área de estudo com zoom aproximado
const map = L.map('map').setView([lat, lng], 18);

// CAMADA DE SATÉLITE (Esri World Imagery)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// CAMADA HÍBRIDA (Insere os nomes das ruas e linhas por cima do satélite)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// CONFIGURAÇÃO DO ÍCONE USANDO A SUA IMAGEM LOCAL DO POSTINHO
const iconePostinhoObjeto = L.icon({
    iconUrl: 'img/postinho.png', // Puxa o seu arquivo físico de dentro da pasta img
    iconSize: [38, 38],          // Tamanho do ícone na tela
    iconAnchor: [19, 38],        // Ponto de fixação na coordenada
    popupAnchor: [0, -38]        // De onde o balão de informações vai abrir
});

// Elementos da interface do usuário
let coordenadaTemporaria = null;
const formCadastro = document.getElementById('form-cadastro');
const inputNumero = document.getElementById('numero-casa');
const selectRisco = document.getElementById('select-risco');
const txtObs = document.getElementById('obs-casa');
const btnSalvar = document.getElementById('btn-salvar');

// Array que guardará os dados das casas e pontos salvos em memória (LocalStorage)
let dadosCasasSalvas = JSON.parse(localStorage.getItem('dadosTerritorializacao')) || [];
// Objeto para gerenciar as instâncias dos marcadores ativos na tela
let marcadoresAtivos = {};

// Função para renderizar um marcador individual no mapa
function criarMarcadorNoMapa(casaObj) {
    let marker;

    // Aplica a sua imagem do postinho se a categoria for UBS
    if (casaObj.risco === 'ubs') {
        marker = L.marker([casaObj.lat, casaObj.lng], {
            icon: iconePostinhoObjeto
        }).addTo(map);
        
    } else {
        // Se for residência, mantém o padrão de bolinhas coloridas de risco
        let colMarcador = '#2ecc71'; 
        if (casaObj.risco === 'amarelo') colMarcador = '#f1c40f';
        if (casaObj.risco === 'vermelho') colMarcador = '#e74c3c';

        marker = L.circleMarker([casaObj.lat, casaObj.lng], {
            radius: 11,
            fillColor: colMarcador,
            color: '#ffffff', 
            weight: 2,
            opacity: 1,
            fillOpacity: 0.95
        }).addTo(map);
    }

    // Configuração de textos e cores internas do pop-up
    let labelExibicao = 'Risco Menor';
    if (casaObj.risco === 'amarelo') labelExibicao = 'Risco Médio';
    if (casaObj.risco === 'vermelho') labelExibicao = 'Risco Máximo';
    if (casaObj.risco === 'ubs') labelExibicao = 'UBS / ESF (Postinho)';

    let corTextoStatus = (casaObj.risco === 'ubs') ? '#1a1a1a' : (casaObj.risco === 'amarelo' ? '#f1c40f' : (casaObj.risco === 'vermelho' ? '#e74c3c' : '#2ecc71'));

    const textoPopup = `
        <div style="font-family: sans-serif; line-height: 1.4; min-width: 160px;">
            <h4 style="margin: 0 0 5px 0; color: #1a1a1a;">${casaObj.numero}</h4>
            <p style="margin: 0 0 5px 0;"><strong>Classificação:</strong> <br><span style="color:${corTextoStatus}; font-weight:bold;">${labelExibicao}</span></p>
            ${casaObj.observacao ? `<p style="margin: 5px 0 8px 0; font-size: 0.9em; color:#555;"><strong>Obs:</strong> ${casaObj.observacao}</p>` : ''}
            <button class="btn-remover" onclick="deletarCasa('${casaObj.id}')">Remover</button>
        </div>
    `;

    marker.bindPopup(textoPopup);
    marcadoresAtivos[casaObj.id] = marker;
}

// Carregar os marcadores cadastrados anteriormente de forma automática ao carregar a página
dadosCasasSalvas.forEach(casa => {
    criarMarcadorNoMapa(casa);
});

// Evento ao clicar no mapa para iniciar um novo registro
map.on('click', function(e) {
    coordenadaTemporaria = e.latlng;
    formCadastro.classList.remove('hidden');
    inputNumero.value = '';
    txtObs.value = '';
    
    if(window.innerWidth < 992) {
        formCadastro.scrollIntoView({ behavior: 'smooth' });
    }
    inputNumero.focus();
});

// Evento do botão Salvar do formulário lateral
btnSalvar.addEventListener('click', function() {
    const numero = inputNumero.value.trim();
    const risco = selectRisco.value;
    const observacao = txtObs.value.trim();
    
    if (numero === '') {
        alert('Por favor, preencha o campo de identificação.');
        return;
    }

    const novaCasa = {
        id: 'ponto_' + new Date().getTime(),
        lat: coordenadaTemporaria.lat,
        lng: coordenadaTemporaria.lng,
        numero: numero,
        risco: risco,
        observacao: observacao
    };

    dadosCasasSalvas.push(novaCasa);
    localStorage.setItem('dadosTerritorializacao', JSON.stringify(dadosCasasSalvas));

    criarMarcadorNoMapa(novaCasa);

    formCadastro.classList.add('hidden');
    coordenadaTemporaria = null;
});

// Função global acionada no pop-up para deletar registros incorretos
window.deletarCasa = function(id) {
    if (confirm("Deseja remover este registro do mapeamento?")) {
        if (marcadoresAtivos[id]) {
            map.removeLayer(marcadoresAtivos[id]);
            delete marcadoresAtivos[id];
        }
        dadosCasasSalvas = dadosCasasSalvas.filter(casa => casa.id !== id);
        localStorage.setItem('dadosTerritorializacao', JSON.stringify(dadosCasasSalvas));
    }
};