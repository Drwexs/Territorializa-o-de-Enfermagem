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

// CAPTURA A IMAGEM DIRETAMENTE DO INDEX.HTML (Pelo ID que configuramos lá)
const caminhoDaImagemDoIndex = document.getElementById('img-postinho-index').src;

// CRIA O ÍCONE PERSONALIZADO COM A SUA IMAGEM DO POSTINHO
const iconePostinhoObjeto = L.divIcon({
    html: `<img src="${caminhoDaImagemDoIndex}" class="icone-postinho-html">`, 
    iconSize: [40, 40],       // Tamanho do ícone no mapa
    iconAnchor: [20, 40],     // Ponto de fixação centralizado na base do ícone
    popupAnchor: [0, -40],    // Ponto onde o balão de texto vai abrir em relação ao ícone
    className: ''             // Remove os estilos padrões do Leaflet para o ícone não quebrar
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

    // Se for UBS, utiliza o ícone da imagem em vez do ponto azul
    if (casaObj.risco === 'ubs') {
        marker = L.marker([casaObj.lat, casaObj.lng], {
            icon: iconePostinhoObjeto
        }).addTo(map);
        
    } else {
        // Se for residência, mantém o padrão de bolinhas coloridas de risco (Verde, Amarelo ou Vermelho)
        let corMarcador = '#2ecc71'; // Verde padrão
        if (casaObj.risco === 'amarelo') corMarcador = '#f1c40f';
        if (casaObj.risco === 'vermelho') corMarcador = '#e74c3c';

        marker = L.circleMarker([casaObj.lat, casaObj.lng], {
            radius: 11,
            fillColor: corMarcador,
            color: '#ffffff', // Borda branca para destacar na imagem escura do satélite
            weight: 2,
            opacity: 1,
            fillOpacity: 0.95
        }).addTo(map);
    }

    // Define o texto amigável do Pop-up baseado na categoria selecionada
    let labelExibicao = 'Risco Menor';
    if (casaObj.risco === 'amarelo') labelExibicao = 'Risco Médio';
    if (casaObj.risco === 'vermelho') labelExibicao = 'Risco Máximo';
    if (casaObj.risco === 'ubs') labelExibicao = 'UBS / ESF (Postinho)';

    // Define a cor do texto do status dentro do balão de informações
    let corTextoStatus = (casaObj.risco === 'ubs') ? '#1a1a1a' : (casaObj.risco === 'amarelo' ? '#f1c40f' : (casaObj.risco === 'vermelho' ? '#e74c3c' : '#2ecc71'));

    // Estrutura do pop-up contendo o nome, classificação, observações e o botão de exclusão
    const textoPopup = `
        <div style="font-family: sans-serif; line-height: 1.4; min-width: 160px;">
            <h4 style="margin: 0 0 5px 0; color: #1a1a1a;">${casaObj.numero}</h4>
            <p style="margin: 0 0 5px 0;"><strong>Classificação:</strong> <br><span style="color:${corTextoStatus}; font-weight:bold;">${labelExibicao}</span></p>
            ${casaObj.observacao ? `<p style="margin: 5px 0 8px 0; font-size: 0.9em; color:#555;"><strong>Obs:</strong> ${casaObj.observacao}</p>` : ''}
            <button class="btn-remover" onclick="deletarCasa('${casaObj.id}')">Remover</button>
        </div>
    `;

    marker.bindPopup(textoPopup);
    
    // Armazena a referência para podermos deletar visualmente depois se necessário
    marcadoresAtivos[casaObj.id] = marker;
}

// Carregar os marcadores cadastrados anteriormente de forma automática ao abrir o site
dadosCasasSalvas.forEach(casa => {
    criarMarcadorNoMapa(casa);
});

// Evento ao clicar no mapa para iniciar um novo registro na coordenada clicada
map.on('click', function(e) {
    coordenadaTemporaria = e.latlng;
    formCadastro.classList.remove('hidden');
    inputNumero.value = '';
    txtObs.value = '';
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

    // Criação do objeto estruturado com ID único baseado no tempo de cadastro
    const novaCasa = {
        id: 'ponto_' + new Date().getTime(),
        lat: coordenadaTemporaria.lat,
        lng: coordenadaTemporaria.lng,
        numero: numero,
        risco: risco,
        observacao: observacao
    };

    // Adiciona o novo ponto na coleção existente e sincroniza no LocalStorage do seu navegador
    dadosCasasSalvas.push(novaCasa);
    localStorage.setItem('dadosTerritorializacao', JSON.stringify(dadosCasasSalvas));

    // Exibe o ponto criado no mapa imediatamente
    criarMarcadorNoMapa(novaCasa);

    // Esconde o painel lateral de cadastro e limpa a variável temporária
    formCadastro.classList.add('hidden');
    coordenadaTemporaria = null;
});

// Função global acionada no botão dentro do pop-up para deletar marcadores inseridos incorretamente
window.deletarCasa = function(id) {
    if (confirm("Deseja remover este registro do mapeamento?")) {
        // Remove a camada visual correspondente do mapa
        if (marcadoresAtivos[id]) {
            map.removeLayer(marcadoresAtivos[id]);
            delete marcadoresAtivos[id];
        }

        // Filtra e limpa a base de dados armazenada na memória local do navegador
        dadosCasasSalvas = dadosCasasSalvas.filter(casa => casa.id !== id);
        localStorage.setItem('dadosTerritorializacao', JSON.stringify(dadosCasasSalvas));
    }
};