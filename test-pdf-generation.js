/**
 * Script de test pour vérifier la génération du PDF
 * Ce script simule la génération d'un PDF avec les nouvelles modifications
 */

const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const fs = require('fs');

// Données de test
const testReportData = {
    workers: [
        {
            name: 'DUPONT Jean',
            sites: [
                {
                    name: 'Chantier A',
                    hours: {
                        monday: 8,
                        tuesday: 7.5,
                        wednesday: 8,
                        thursday: 8,
                        friday: 7
                    }
                },
                {
                    name: 'Chantier B',
                    hours: {
                        monday: 0,
                        tuesday: 0.5,
                        wednesday: 0,
                        thursday: 0,
                        friday: 1
                    }
                }
            ],
            observation: 'Travail de qualité, bon respect des consignes de sécurité.',
            drivers: {
                monday: true,
                tuesday: false,
                wednesday: true,
                thursday: false,
                friday: false
            },
            panierMode: 'panier',
            panierCustom: {},
            isInterim: true
        },
        {
            name: 'MARTIN Sophie',
            sites: [
                {
                    name: 'Chantier C',
                    hours: {
                        monday: 8,
                        tuesday: 8,
                        wednesday: 8,
                        thursday: 8,
                        friday: 8
                    }
                }
            ],
            observation: '',
            drivers: {
                monday: false,
                tuesday: true,
                wednesday: false,
                thursday: true,
                friday: true
            },
            panierMode: 'grand_deplacement',
            panierCustom: {},
            isInterim: false
        }
    ]
};

const testWeekInfo = {
    period: 'Du 28 octobre au 1er novembre 2024',
    foreman: 'DURAND Michel',
    weekNumber: 'S44-2024'
};

// Fonction de génération (copie de send-report.js)
async function generatePDF(reportData, weekInfo) {
    try {
        const doc = new jsPDF();
        
        reportData.workers.forEach((worker, index) => {
            if (index > 0) {
                doc.addPage();
            }
            
            // En-tête - 3 colonnes
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Semaine', 15, 15);
            doc.text(weekInfo.weekNumber || '', 15, 20);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('FICHE DE POINTAGE HEBDOMADAIRE', 105, 15, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(weekInfo.period || '', 105, 20, { align: 'center' });
            
            doc.setFontSize(9);
            doc.text('NOM:', 170, 15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(worker.name || '', 170, 20);
            doc.setFont(undefined, 'normal');
            
            // Tableau des heures avec SAMEDI
            const tableData = [];
            
            // Ajouter les chantiers
            worker.sites.forEach(site => {
                const total = (site.hours.monday || 0) + (site.hours.tuesday || 0) + 
                              (site.hours.wednesday || 0) + (site.hours.thursday || 0) + 
                              (site.hours.friday || 0);
                
                tableData.push([
                    site.name || '',
                    site.hours.monday ? site.hours.monday.toString() : '',
                    site.hours.tuesday ? site.hours.tuesday.toString() : '',
                    site.hours.wednesday ? site.hours.wednesday.toString() : '',
                    site.hours.thursday ? site.hours.thursday.toString() : '',
                    site.hours.friday ? site.hours.friday.toString() : '',
                    '', // SAMEDI vide
                    total > 0 ? total.toFixed(1) : ''
                ]);
            });
            
            // Lignes vides pour remplir (minimum 5 lignes de chantiers)
            const emptyRows = Math.max(0, 5 - worker.sites.length);
            for (let i = 0; i < emptyRows; i++) {
                tableData.push(['', '', '', '', '', '', '', '']);
            }
            
            // Calculer les totaux des heures
            let mondayTotal = 0, tuesdayTotal = 0, wednesdayTotal = 0, thursdayTotal = 0, fridayTotal = 0;
            worker.sites.forEach(site => {
                mondayTotal += site.hours.monday || 0;
                tuesdayTotal += site.hours.tuesday || 0;
                wednesdayTotal += site.hours.wednesday || 0;
                thursdayTotal += site.hours.thursday || 0;
                fridayTotal += site.hours.friday || 0;
            });
            const grandTotal = mondayTotal + tuesdayTotal + wednesdayTotal + thursdayTotal + fridayTotal;
            
            // Ligne de total des heures
            tableData.push([
                '',
                '',
                '',
                '',
                '',
                '',
                'Total',
                grandTotal > 0 ? grandTotal.toFixed(1) : ''
            ]);
            
            // Calculer PANIER, TRANSPORT, TRAJET
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            
            // Jours travaillés
            const workedDays = days.map(day => {
                let totalHours = 0;
                worker.sites.forEach(site => {
                    totalHours += site.hours[day] || 0;
                });
                return totalHours > 0;
            });
            
            // Jours où l'ouvrier est conducteur
            const isDriverDays = days.map(day => worker.drivers && worker.drivers[day]);
            
            // PANIER
            const panierMode = worker.panierMode || 'panier';
            const panierCustom = worker.panierCustom || {};
            let panierValues = [];
            
            if (panierMode === 'panier') {
                panierValues = workedDays.map(worked => worked ? '1' : '');
            } else if (panierMode === 'grand_deplacement') {
                panierValues = workedDays.map(worked => worked ? 'GD' : '');
            } else if (panierMode === 'personnaliser') {
                panierValues = days.map((day, index) => {
                    return workedDays[index] ? (panierCustom[day] || '') : '';
                });
            }
            const panierTotal = panierValues.filter(v => v !== '').length;
            
            // TRANSPORT
            const transportValues = isDriverDays.map(isDriver => isDriver ? '1' : '');
            const transportTotal = transportValues.filter(v => v === '1').length;
            
            // TRAJET
            const trajetValues = workedDays.map(worked => worked ? '1' : '');
            const trajetTotal = trajetValues.filter(v => v === '1').length;
            
            // Ligne PANIER
            tableData.push([
                'PANIER',
                panierValues[0] || '',
                panierValues[1] || '',
                panierValues[2] || '',
                panierValues[3] || '',
                panierValues[4] || '',
                '',
                panierTotal > 0 ? panierTotal.toString() : ''
            ]);
            
            // Ligne TRANSPORT
            tableData.push([
                'TRANSPORT',
                transportValues[0] || '',
                transportValues[1] || '',
                transportValues[2] || '',
                transportValues[3] || '',
                transportValues[4] || '',
                '',
                transportTotal > 0 ? transportTotal.toString() : ''
            ]);
            
            // Ligne TRAJET
            tableData.push([
                'TRAJET',
                trajetValues[0] || '',
                trajetValues[1] || '',
                trajetValues[2] || '',
                trajetValues[3] || '',
                trajetValues[4] || '',
                '',
                trajetTotal > 0 ? trajetTotal.toString() : ''
            ]);
            
            doc.autoTable({
                startY: 30,
                head: [['CHANTIER', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'TOTAL']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] },
                bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] },
                columnStyles: {
                    0: { cellWidth: 45, halign: 'left', fontSize: 8 },
                    1: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    2: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    3: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    4: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    5: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    6: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    7: { cellWidth: 21, halign: 'center', fontSize: 9, fontStyle: 'bold' }
                },
                didParseCell: function(data) {
                    // Mettre en gras les lignes PANIER, TRANSPORT, TRAJET, et la ligne de total
                    const rowData = tableData[data.row.index];
                    if (rowData && (rowData[0] === 'PANIER' || rowData[0] === 'TRANSPORT' || rowData[0] === 'TRAJET')) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                    // Ligne de total des heures
                    if (rowData && rowData[6] === 'Total') {
                        data.cell.styles.fontStyle = 'bold';
                        if (data.column.index === 7) {
                            data.cell.styles.textColor = [255, 0, 0];
                        }
                    }
                }
            });
            
            // Observations
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            let observationText = 'OBSERVATIONS:';
            if (worker.isInterim !== false) {
                observationText += '                    INTÉRIMAIRE';
            }
            doc.text(observationText, 15, finalY);
            doc.setFont(undefined, 'normal');
            if (worker.observation) {
                doc.setFontSize(10);
                doc.setFont(undefined, 'italic');
                const lines = doc.splitTextToSize(worker.observation, 180);
                doc.text(lines, 105, finalY + 7, { align: 'center' });
            }
            
            // Pied de page
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Référence: Agenda chef d\'équipe', 15, 270);
            doc.text('Visa conducteur:', 110, 270);
        });
        
        return doc;
        
    } catch (error) {
        throw error;
    }
}

// Exécuter le test
console.log('🧪 Test de génération du PDF...\n');

generatePDF(testReportData, testWeekInfo)
    .then(doc => {
        // Sauvegarder le PDF
        const pdfOutput = doc.output('arraybuffer');
        const buffer = Buffer.from(pdfOutput);
        fs.writeFileSync('test-rapport.pdf', buffer);
        
        console.log('✅ PDF généré avec succès !');
        console.log('📄 Fichier créé : test-rapport.pdf');
        console.log('\n📊 Contenu du PDF :');
        console.log('   - 2 ouvriers (DUPONT Jean - Intérimaire, MARTIN Sophie)');
        console.log('   - Colonnes : CHANTIER, LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI, TOTAL');
        console.log('   - Lignes : Chantiers + Total + PANIER + TRANSPORT + TRAJET');
        console.log('   - DUPONT : Mode panier standard, conducteur lundi et mercredi');
        console.log('   - MARTIN : Mode grand déplacement, conductrice mardi, jeudi et vendredi');
        console.log('\n✨ Vérifiez le fichier test-rapport.pdf pour voir le résultat !');
    })
    .catch(error => {
        console.error('❌ Erreur lors de la génération du PDF :', error);
        process.exit(1);
    });
