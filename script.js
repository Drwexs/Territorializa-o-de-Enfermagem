// ======================================================
// VERIFICAÇÃO DE NAVEGADOR COM RECOMENDAÇÃO AMIGÁVEL
// ======================================================
(function verificarNavegadorRecomendado() {
    const userAgent = navigator.userAgent.toLowerCase();
    const ehDispositivoMovel = /iphone|ipad|ipod|android|blackberry|iemobile|kindle|opera mini|silk/.test(userAgent);
    
    const ehChrome = userAgent.includes('chrome') || userAgent.includes('crios');
    const ehSafari = userAgent.includes('safari') && !ehChrome;
    const ehEdge = userAgent.includes('edg');
    const ehOpera = userAgent.includes('opr') || userAgent.includes('opera');

    let precisaMostrarAviso = false;

    if (ehDispositivoMovel) {
        if (!ehSafari) precisaMostrarAviso = true;
    } else {
        if (!ehChrome || ehEdge || ehOpera) precisaMostrarAviso = true;
    }

    if (precisaMostrarAviso) {
        // Exibe o aviso caso o navegador não seja o 100% ideal
        const telaAviso = document.getElementById('bloqueio-navegador');
        if (telaAviso) {
            telaAviso.style.setProperty('display', 'flex', 'important');
            telaAviso.classList.remove('hidden');
        } else {
            // Garante a exibição mesmo se o HTML atrasar um milissegundo para carregar
            window.addEventListener('DOMContentLoaded', () => {
                const divAviso = document.getElementById('bloqueio-navegador');
                if (divAviso) {
                    divAviso.style.setProperty('display', 'flex', 'important');
                    divAviso.classList.remove('hidden');
                }
            });
        }
    }
})();

// ======================================================
// CONFIGURAÇÃO INICIAL DO MAPA
// ======================================================

const lat = -25.620417;
const lng = -53.343028;

const map = L.map('map').setView([lat, lng], 16);

// MAPA SATÉLITE
L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        maxZoom: 19,
        attribution: 'Tiles © Esri'
    }
).addTo(map);

// NOMES DAS RUAS
L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
    {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 20
    }
).addTo(map);

// ======================================================
// ÍCONES PERSONALIZADOS
// ======================================================

const iconePostinhoObjeto = L.icon({
    iconUrl: 'img/postinho.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const iconeAcademiaObjeto = L.icon({
    iconUrl: 'img/ACADEMIA TERCEIRA IDADE.png',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
});

const iconeIgrejaObjeto = L.icon({
    iconUrl: 'img/igreja.png',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
});

const iconeCrecheObjeto = L.icon({
    iconUrl: 'img/Creche.png',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
});

const iconeEscolaObjeto = L.icon({
    iconUrl: 'img/Escola.png',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
});

const iconeCemiterioObjeto = L.icon({
    iconUrl: 'img/Cemitério.png',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
});

// VARIAVEIS DA INTERFACE
let coordenadaTemporaria = null;
const formCadastro = document.getElementById('form-cadastro');
const inputNumero = document.getElementById('numero-casa');
const selectRisco = document.getElementById('select-risco');
const txtObs = document.getElementById('obs-casa');
const btnSalvar = document.getElementById('btn-salvar');

// LOCALSTORAGE
let dadosCasasSalvas = JSON.parse(localStorage.getItem('dadosTerritorializacao')) || [];
let marcadoresAtivos = {};

// ======================================================
// FUNÇÃO DE RENDERIZAÇÃO DE MARCADORES
// ======================================================

function criarMarcadorNoMapa(casaObj) {
    let marker;

    if (
        casaObj.risco === 'ubs' ||
        casaObj.risco === 'academia' ||
        casaObj.risco === 'igreja' ||
        casaObj.risco === 'creche' ||
        casaObj.risco === 'escola' ||
        casaObj.risco === 'cemiterio'
    ) {
        const ehUBS = casaObj.risco === 'ubs';
        const ehAcademia = casaObj.risco === 'academia';
        const ehIgreja = casaObj.risco === 'igreja';
        const ehCreche = casaObj.risco === 'creche';
        const ehEscola = casaObj.risco === 'escola';

        const corTexto =
            ehUBS ? '#1565c0' :
            ehAcademia ? '#e91e63' :
            ehIgreja ? '#ef6c00' :
            ehCreche ? '#7b1fa2' :
            ehEscola ? '#00acc1' :
            '#757575';

        const titulo =
            ehUBS ? 'UBS / ESF (Fixa)' :
            ehAcademia ? 'Academia Terceira Idade (Fixa)' :
            ehIgreja ? 'Igreja (Fixa)' :
            ehCreche ? 'Creche (Fixa)' :
            ehEscola ? 'Escola (Fixa)' :
            'Cemitério (Fixo)';

        const icone =
            ehUBS ? iconePostinhoObjeto :
            ehAcademia ? iconeAcademiaObjeto :
            ehIgreja ? iconeIgrejaObjeto :
            ehCreche ? iconeCrecheObjeto :
            ehEscola ? iconeEscolaObjeto :
            iconeCemiterioObjeto;

        marker = L.marker([casaObj.lat, casaObj.lng], { icon: icone }).addTo(map);

        marker.bindPopup(`
            <div style="font-family:sans-serif;min-width:180px;">
                <h4 style="margin:0 0 8px 0;">${casaObj.numero}</h4>
                <p style="margin:0;font-weight:bold;color:${corTexto};">${titulo}</p>
                ${casaObj.observacao ? `<p style="margin-top:8px;color:#555;"><strong>Obs:</strong> ${casaObj.observacao}</p>` : ''}
                <button class="btn-remover" onclick="deletarCasa('${casaObj.id}')">Remover</button>
            </div>
        `);
    } else {
        let corMarcador = '#2e7d32';
        let classificacao = 'Risco Menor';

        if (casaObj.risco === 'amarelo') {
            corMarcador = '#f9a825';
            classificacao = 'Risco Médio';
        }
        if (casaObj.risco === 'vermelho') {
            corMarcador = '#d32f2f';
            classificacao = 'Risco Máximo';
        }

        marker = L.circleMarker([casaObj.lat, casaObj.lng], {
            radius: 11,
            fillColor: corMarcador,
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.95
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-family:sans-serif;min-width:180px;">
                <h4>${casaObj.numero}</h4>
                <p style="font-weight:bold;color:${corMarcador};">${classificacao}</p>
                ${casaObj.observacao ? `<p><strong>Obs:</strong> ${casaObj.observacao}</p>` : ''}
                <button class="btn-remover" onclick="deletarCasa('${casaObj.id}')">Remover</button>
            </div>
        `);
    }

    marcadoresAtivos[casaObj.id] = marker;
}

// CARREGAR REGISTROS INICIAIS
dadosCasasSalvas.forEach(casa => criarMarcadorNoMapa(casa));

// EVENTO DE CLIQUE NO MAPA
map.on('click', function(e) {
    coordenadaTemporaria = e.latlng;
    formCadastro.classList.remove('hidden');
    inputNumero.value = '';
    txtObs.value = '';
    inputNumero.focus();

    if (window.innerWidth < 992) {
        formCadastro.scrollIntoView({ behavior: 'smooth' });
    }
});

// SALVAR REGISTRO
btnSalvar.addEventListener('click', function() {
    if (!coordenadaTemporaria) {
        alert('Clique no mapa antes de cadastrar.');
        return;
    }

    const numero = inputNumero.value.trim();
    const risco = selectRisco.value;
    const observacao = txtObs.value.trim();

    if (numero === '') {
        alert('Preencha o nome.');
        return;
    }

    const novaCasa = {
        id: 'ponto_' + Date.now(),
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

// DELETAR MARCADOR
window.deletarCasa = function(id) {
    const confirmar = confirm('Deseja remover este registro?');
    if (!confirmar) return;

    if (marcadoresAtivos[id]) {
        map.removeLayer(marcadoresAtivos[id]);
        delete marcadoresAtivos[id];
    }

    dadosCasasSalvas = dadosCasasSalvas.filter(casa => casa.id !== id);
    localStorage.setItem('dadosTerritorializacao', JSON.stringify(dadosCasasSalvas));
};

// ======================================================
// IMPORTAÇÃO / EXPORTAÇÃO (SINC)
// ======================================================

document.getElementById('btn-exportar').addEventListener('click', function() {
    if (dadosCasasSalvas.length === 0) {
        alert("Não há dados cadastrados neste aparelho para exportar.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosCasasSalvas));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "mapa_territorializacao_dados.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

document.getElementById('btn-importar').addEventListener('click', function() {
    document.getElementById('input-file').click();
});

document.getElementById('input-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            if (Array.isArray(dadosImportados)) {
                const idsExistentes = dadosCasasSalvas.map(casa => casa.id);
                
                dadosImportados.forEach(casaImportada => {
                    if (!idsExistentes.includes(casaImportada.id)) {
                        dadosCasasSalvas.push(casaImportada);
                    }
                });

                localStorage.setItem('dadosTerritorializacao', JSON.stringify(dadosCasasSalvas));
                
                for (let id in marcadoresAtivos) { map.removeLayer(marcadoresAtivos[id]); }
                marcadoresAtivos = {};
                dadosCasasSalvas.forEach(casa => criarMarcadorNoMapa(casa));

                alert("Dados integrados com sucesso! O mapa foi updated.");
            } else {
                alert("O arquivo selecionado é inválido.");
            }
        } catch (err) {
            alert("Erro ao processar o arquivo de dados.");
        }
    };
    reader.readAsText(file);
});