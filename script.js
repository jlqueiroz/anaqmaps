 // Inicialização do mapa
 const mapa = L.map('map').setView([-23.5664559, -46.5776674], 16); // Coordenadas iniciais (Uvis)
        
 // Adicionar camada do OpenStreetMap
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © AnaqMaps'
 }).addTo(mapa);

 // Função para buscar endereço e desenhar o círculo
 function buscarEndereco() {
     const endereco = document.getElementById('endereco').value;
     if (!endereco) {
         alert("Por favor, insira um endereço.");
         return;
     }

     // Usar Nominatim para geocodificação
     fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`)
         .then(response => response.json())
         .then(data => {
             if (data.length > 0) {
                 const lat = parseFloat(data[0].lat);
                 const lon = parseFloat(data[0].lon);

                 // Limpar marcadores e círculos anteriores
                 if (window.marcador) {
                     mapa.removeLayer(window.marcador);
                 }
                 if (window.circulo) {
                     mapa.removeLayer(window.circulo);
                 }

                 // Adicionar marcador com balão
                 window.marcador = L.marker([lat, lon]).addTo(mapa)
                     .bindPopup(`<b>Endereço:</b><br>${endereco}`)
                     .openPopup();

                 // Desenhar o círculo
                 window.circulo = L.circle([lat, lon], {
                     radius: 150, // Raio de 150 metros
                     color: 'blue',
                     fillColor: '#30b0ff',
                     fillOpacity: 0.3 // Transparência de 30%
                 }).addTo(mapa);

                 // Centralizar o mapa no endereço
                 mapa.setView([lat, lon], 12);
             } else {
                 alert("Endereço não encontrado.");
             }
         })
         .catch(error => {
             console.error("Erro ao buscar endereço:", error);
             alert("Erro ao buscar endereço. Tente novamente.");
         });
 }

 // Função para importar KML
 function importarKML() {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = '.kml';
     input.onchange = (e) => {
         const arquivo = e.target.files[0];
         const reader = new FileReader();
         reader.onload = (event) => {
             const nomeArquivo = arquivo.name.replace('.kml', ''); // Extrai o nome do arquivo
             const kml = omnivore.kml.parse(event.target.result);
             kml.addTo(mapa);

             // Adicionar rótulos fixos aos elementos do KML
             kml.eachLayer((layer) => {
                 if (layer.feature && layer.feature.properties && layer.feature.properties.name) {
                     const nomeElemento = layer.feature.properties.name;
                     let coordenadas;

                     if (layer.getLatLng) {
                         coordenadas = layer.getLatLng(); // Para marcadores
                     } else if (layer.getBounds) {
                         coordenadas = layer.getBounds().getCenter(); // Para polígonos e linhas
                     }

                     if (coordenadas) {
                         L.marker(coordenadas, {
                             icon: L.divIcon({
                                 className: 'rotulo-fixo',
                                 html: `<div style="background: transparent; color: black; font-weight: bold;">${nomeElemento}</div>`,
                                 iconSize: [90, 10] // Tamanho do rótulo
                             })
                         }).addTo(mapa);
                     }
                 }
             });

             mapa.fitBounds(kml.getBounds()); // Ajustar zoom para o KML
         };
         reader.readAsText(arquivo);
     };
     input.click();
 }        

 // Função para exportar PDF
 function exportarPDF() {
     const titulo = document.getElementById('titulo').value;
     const formato = document.getElementById('formato').value;
     const orientacao = document.getElementById('orientacao').value;

     html2canvas(document.querySelector("#map"), {
         useCORS: true,
         scale: 1
     }).then(canvas => {
         const imgDados = canvas.toDataURL('image/png');
         const pdf = new jspdf.jsPDF({
             orientation: orientacao,
             unit: 'mm',
             format: formato
         });

         // Adicionar título centralizado
         if (titulo) {
             pdf.setFontSize(20);
             const tituloLargura = pdf.getStringUnitWidth(titulo) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
             const margemEsquerda = (pdf.internal.pageSize.getWidth() - tituloLargura) / 2;
             pdf.text(titulo, margemEsquerda, 20); // Centralizado no topo
         }

         // Calcular dimensões da imagem no PDF
         const pdfLargura = pdf.internal.pageSize.getWidth();
         const pdfAltura = pdf.internal.pageSize.getHeight();
         const proporcao = canvas.width / canvas.height;
         const imgLargura = pdfLargura;
         const imgAltura = imgLargura / proporcao;

         // Adicionar imagem ao PDF (ocupando toda a folha)
         pdf.addImage(imgDados, 'PNG', 0, 30, imgLargura, imgAltura); // Ajuste a posição Y (30) para o título

         // Salvar o arquivo
         pdf.save('mapa_exportado.pdf');
     });
 }