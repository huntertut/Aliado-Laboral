import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CV_EXAMPLES } from '../data/kitLaboralData';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

// Local mapping for assets
const GUIDE_VISUALS: Record<string, any> = {
    'CONTRACT_GUIDE': require('../assets/guides/guiacontrato.png'),
    'PAYSLIP_GUIDE': require('../assets/guides/desglose_nomina_es.png'),
    'RESIGNATION_CHECKLIST': require('../assets/guides/checklistrenuncia.png'),
    'SETTLEMENT_GUIDE': require('../assets/guides/guiafiniquito.png'),
    'FUNDAMENTAL_RIGHTS': require('../assets/guides/guiaderechos.png'),
    'EMERGENCY_GUIDE': require('../assets/guides/guia_emergencia_es.jpg'),
};

const MyChestScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [selectedVisual, setSelectedVisual] = useState<any>(null);
    const [viewerVisible, setViewerVisible] = useState(false);

    const handleSupportPress = (item: typeof CV_EXAMPLES[0]) => {
        const assetKey = (item as any).visualAsset;
        if (assetKey && GUIDE_VISUALS[assetKey]) {
            setSelectedVisual({
                image: GUIDE_VISUALS[assetKey],
                title: item.title
            });
            setViewerVisible(true);
        } else {
            generatePdf(item);
        }
    };

    const generatePdf = async (item: typeof CV_EXAMPLES[0]) => {
        const isPro = user?.plan === 'PRO' || user?.plan === 'PREMIUM';

        if (item.isPremium && !isPro) {
            Alert.alert(
                'Contenido Premium',
                `La plantilla "${item.title}" es exclusiva para miembros Premium.\n\nSuscríbete para acceder a diseños profesionales y creativos.`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Ser Premium', onPress: () => navigation.navigate('SubscriptionManagement' as never) }
                ]
            );
            return;
        }


        try {
            // Generate HTML based on category
            let html = '';

            if (item.category === 'LETTER') {
                const { asunto, destinatario, cuerpo, despedida } = item.content as any;
                html = `
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Times New Roman', serif; padding: 60px; color: #000; line-height: 1.6; }
                            .date { text-align: right; margin-bottom: 40px; }
                            .recipient { margin-bottom: 30px; font-weight: bold; }
                            .subject { font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
                            .body { white-space: pre-wrap; margin-bottom: 40px; }
                            .footer { white-space: pre-wrap; margin-top: 60px; }
                        </style>
                    </head>
                    <body>
                        <div class="date">[Lugar y Fecha]</div>
                        <div class="recipient">${destinatario}</div>
                        <div class="subject">Asunto: ${asunto}</div>
                        <div class="body">${cuerpo}</div>
                        <div class="footer">${despedida}</div>
                    </body>
                    </html>
                `;
            } else if (item.category === 'SUPPORT') {
                const content = item.content as any;
                html = `
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                            h1 { color: #2c3e50; border-bottom: 2px solid ${AppTheme.colors.primary}; padding-bottom: 10px; margin-bottom: 20px; }
                            h2 { color: ${AppTheme.colors.primary}; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                            .intro { background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${AppTheme.colors.primary}; margin-bottom: 25px; font-style: italic; }
                            .card { border: 1px solid #eee; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                            .card-title { font-weight: bold; color: #2c3e50; font-size: 16px; margin-bottom: 5px; }
                            .card-desc { color: #555; margin-bottom: 8px; }
                            .card-example { font-style: italic; color: #7f8c8d; background: #fdfdfd; padding: 8px; border: 1px dashed #ddd; margin-bottom: 8px; font-size: 13px; }
                            .card-alert { color: #e67e22; font-weight: bold; font-size: 13px; margin-top: 5px; background: #fff3e0; padding: 5px; border-radius: 3px; }
                            .section-header { font-weight: bold; color: #2c3e50; margin: 15px 0 10px 0; font-size: 18px; }
                            .note { background: #fff3e0; padding: 15px; border-radius: 5px; color: #e67e22; margin-top: 30px; font-weight: bold; }
                            ul { padding-left: 20px; }
                            li { margin-bottom: 8px; }
                        </style>
                    </head>
                    <body>
                        <h1>${item.title}</h1>
                        <div class="intro">${content.queEs || content.introduccion || ''}</div>

                        ${content.queRevisar ? content.queRevisar.map((q: any) => `
                            <div class="card">
                                <div class="card-title">${q.clausula}</div>
                                <div class="card-desc">${q.descripcion}</div>
                                <div class="card-example"><strong>Ejemplo:</strong> ${q.ejemplo}</div>
                                <div class="card-alert">⚠️ ALERTA: ${q.alerta}</div>
                            </div>
                        `).join('') : ''}

                        ${content.desglose ? content.desglose.map((d: any) => `
                            <h2>${d.seccion}</h2>
                            <p>${d.descripcion}</p>
                            <ul>
                                ${d.conceptos ? Object.entries(d.conceptos).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') : ''}
                            </ul>
                        `).join('') : ''}

                        ${content.checklist ? content.checklist.map((c: any) => `
                            <div class="card">
                                <div class="card-title">✅ ${c.paso}</div>
                                <div class="card-desc">${c.descripcion}</div>
                            </div>
                        `).join('') : ''}

                        ${content.componentes ? content.componentes.map((c: any) => `
                            <div class="card">
                                <div class="card-title">${c.concepto}</div>
                                <div class="card-desc">${c.descripcion}</div>
                            </div>
                        `).join('') : ''}

                        ${content.alerta ? `<div class="note">⚠️ IMPORTANTE: ${content.alerta}</div>` : ''}
                        
                        <p style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px;">
                            Guía referencial de Derechos Laborales MX. Este documento no sustituye asesoría legal personalizada.
                        </p>
                    </body>
                    </html>
                `;
            } else if (item.category === 'GUIDE') {
                const content = item.content as any;
                html = `
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                            h1 { color: #2c3e50; border-bottom: 2px solid ${AppTheme.colors.primary}; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                            h2 { color: ${AppTheme.colors.primary}; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                            .section-box { border: 1px solid #eee; padding: 15px; margin-bottom: 20px; border-radius: 10px; background-color: #fcfcfc; }
                            .section-title { font-weight: bold; color: ${AppTheme.colors.primary}; font-size: 18px; margin-bottom: 10px; }
                            .point-item { margin-bottom: 8px; }
                            .point-bullet { color: ${AppTheme.colors.primary}; margin-right: 10px; font-weight: bold; }
                            .footer-text { margin-top: 40px; font-style: italic; color: #7f8c8d; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                            .step-box { background: #fff; border-left: 5px solid ${AppTheme.colors.primary}; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                            .step-num { font-weight: bold; color: ${AppTheme.colors.primary}; font-size: 20px; }
                        </style>
                    </head>
                    <body>
                        <h1>${content.titulo}</h1>
                        
                        ${content.secciones ? content.secciones.map((s: any) => `
                            <div class="section-box">
                                <div class="section-title">${s.titulo}</div>
                                ${s.puntos.map((p: string) => `
                                    <div class="point-item">
                                        <span class="point-bullet">•</span>
                                        <span>${p}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('') : ''}

                        ${content.pasos ? content.pasos.map((p: any) => `
                            <div class="step-box">
                                <div class="step-num">Paso ${p.numero}</div>
                                <div style="font-weight: bold; margin: 5px 0; font-size: 16px;">${p.titulo}</div>
                                <div style="color: #555;">${p.descripcion}</div>
                            </div>
                        `).join('') : ''}

                        <div class="footer-text">${content.pieDePagina || 'Guía de Emergencia - Alianza Laboral'}</div>
                    </body>
                    </html>
                `;
            } else {
                // Default CV Template
                const { header, sections } = item.content as any;
                html = `
    <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                            h2 { color: #34495e; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                            .contact { color: #7f8c8d; font-size: 14px; margin-bottom: 30px; }
                            .item { margin-bottom: 15px; }
                            .item-title { font-weight: bold; font-size: 16px; }
                            .item-subtitle { font-style: italic; color: #555; }
                            ul { margin-top: 5px; }
                            li { margin-bottom: 5px; }
                        </style>
                    </head>
                    <body>
                        <h1>${header.name}</h1>
                        <div class="contact">
                            ${Object.values(header.contact).join(' | ')}
                            ${header.title ? `<br><strong>${header.title}</strong>` : ''}
                        </div>

                        ${sections.map((section: any) => `
                            <h2>${section.title}</h2>
                            ${section.items.map((subItem: any) => {
                    if (typeof subItem === 'string') return `<li>${subItem}</li>`;

                    // Structured Item (Experience/Education)
                    return `
                                    <div class="item">
                                        <div class="item-title">${subItem.position || subItem.degree || subItem.projectName}</div>
                                        <div class="item-subtitle">
                                            ${subItem.company || subItem.institution || ''} 
                                            ${subItem.date ? `(${subItem.date})` : ''}
                                        </div>
                                        ${subItem.responsibilities ? `<ul>${subItem.responsibilities.map((r: string) => `<li>${r}</li>`).join('')}</ul>` : ''}
                                        ${subItem.description ? `<p>${subItem.description}</p>` : ''}
                                    </div>
                                `;
                }).join('')}
                        `).join('')}
                    </body>
                    </html>
                `;
            }

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            Alert.alert('Error', 'No se pudo generar el PDF. Inténtalo de nuevo.');
            console.error(error);
        }
    };

    const cvItems = CV_EXAMPLES.filter(item => item.category === 'CV');
    const letterItems = CV_EXAMPLES.filter(item => item.category === 'LETTER');
    const supportItems = CV_EXAMPLES.filter(item => item.category === 'SUPPORT');
    const printableItems = CV_EXAMPLES.filter(item => item.category === 'GUIDE');

    const hasPremium = user?.plan === 'PRO' || user?.plan === 'PREMIUM' || user?.plan === 'premium' || user?.subscriptionLevel === 'premium';

    const handleVaultPress = () => {
        if (!hasPremium) {
            Alert.alert(
                "Mi Baúl Personal (Premium)",
                "Guarda de forma segura tus recibos, contratos y evidencias. Podrás compartirlos con tu abogado con un solo clic.",
                [
                    { text: "Ver Planes", onPress: () => navigation.navigate('SubscriptionManagement' as never) },
                    { text: "Cerrar", style: "cancel" }
                ]
            );
        } else {
            navigation.navigate('Vault' as never);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
                    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Kit Laboral</Text>
            </View>


            <ScrollView contentContainerStyle={styles.content}>

                {/* Personal Vault Premium Button */}
                <TouchableOpacity
                    style={styles.vaultButton}
                    onPress={handleVaultPress}
                >
                    <View style={styles.vaultIconContainer}>
                        <Ionicons name="cloud-upload" size={24} color="#fff" />
                    </View>
                    <View style={styles.vaultTextContainer}>
                        <Text style={styles.vaultTitle}>Mi Baúl Personal</Text>
                        <Text style={styles.vaultSubtitle}>Sube tus evidencias y documentos seguros.</Text>
                    </View>
                    {!hasPremium && (
                        <View style={styles.vaultPremiumTag}>
                            <Text style={styles.vaultPremiumText}>PRO</Text>
                        </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
                </TouchableOpacity>

                {/* CV Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text" size={24} color={AppTheme.colors.primary} style={styles.sectionIcon} />
                        <View>
                            <Text style={styles.sectionTitle}>Ejemplos de Currículum (CV)</Text>
                            <Text style={styles.sectionDescription}>Plantillas modernas listas para descargar.</Text>
                        </View>
                    </View>

                    <View style={styles.itemsList}>
                        {cvItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemRow}
                                onPress={() => generatePdf(item)}
                            >
                                <View style={styles.itemIcon}>
                                    <Ionicons
                                        name={item.category === 'CV' ? "document" : "document-text"}
                                        size={20}
                                        color="#7f8c8d"
                                    />
                                </View>
                                <Text style={styles.itemName}>{item.title}</Text>
                                <View style={styles.actionContainer}>
                                    {item.isPremium && !hasPremium ? (
                                        <View style={styles.premiumTag}>
                                            <Ionicons name="lock-closed" size={14} color="#e67e22" />
                                            <Text style={styles.premiumText}>PRO</Text>
                                        </View>
                                    ) : (
                                        <Ionicons name="cloud-download-outline" size={20} color={AppTheme.colors.primary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Letters Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="mail-open" size={24} color={AppTheme.colors.primary} style={styles.sectionIcon} />
                        <View>
                            <Text style={styles.sectionTitle}>Cartas de Solicitud</Text>
                            <Text style={styles.sectionDescription}>Modelos para comunicarte formalmente.</Text>
                        </View>
                    </View>

                    <View style={styles.itemsList}>
                        {letterItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemRow}
                                onPress={() => generatePdf(item)}
                            >
                                <View style={styles.itemIcon}>
                                    <Ionicons
                                        name="reader-outline"
                                        size={20}
                                        color="#7f8c8d"
                                    />
                                </View>
                                <Text style={styles.itemName}>{item.title}</Text>
                                <View style={styles.actionContainer}>
                                    {item.isPremium && !hasPremium ? (
                                        <View style={styles.premiumTag}>
                                            <Ionicons name="lock-closed" size={14} color="#e67e22" />
                                            <Text style={styles.premiumText}>PRO</Text>
                                        </View>
                                    ) : (
                                        <Ionicons name="cloud-download-outline" size={20} color={AppTheme.colors.primary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Support Documents Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle" size={24} color={AppTheme.colors.primary} style={styles.sectionIcon} />
                        <View>
                            <Text style={styles.sectionTitle}>Documentos de Apoyo</Text>
                            <Text style={styles.sectionDescription}>Guías referenciales para proteger tus derechos.</Text>
                        </View>
                    </View>

                    <View style={styles.itemsList}>
                        {supportItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemRow}
                                onPress={() => handleSupportPress(item)}
                            >
                                <View style={styles.itemIcon}>
                                    <Ionicons
                                        name="shield-checkmark"
                                        size={20}
                                        color="#7f8c8d"
                                    />
                                </View>
                                <Text style={styles.itemName}>{item.title}</Text>
                                <View style={styles.actionContainer}>
                                    {item.isPremium && !hasPremium ? (
                                        <View style={styles.premiumTag}>
                                            <Ionicons name="lock-closed" size={14} color="#e67e22" />
                                            <Text style={styles.premiumText}>PRO</Text>
                                        </View>
                                    ) : (
                                        <Ionicons name="eye-outline" size={20} color={AppTheme.colors.primary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.downloadAllGuide}
                        onPress={() => Alert.alert('Guía Completa', 'Puedes generar el PDF completo con todas las guías para consulta offline.')}
                    >
                        <Ionicons name="download-outline" size={16} color={AppTheme.colors.primary} />
                        <Text style={styles.downloadAllText}>Generar PDF de consulta offline</Text>
                    </TouchableOpacity>
                </View>

                {/* Printable Guides Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="print" size={24} color={AppTheme.colors.primary} style={styles.sectionIcon} />
                        <View>
                            <Text style={styles.sectionTitle}>Guías Rápidas Imprimibles</Text>
                            <Text style={styles.sectionDescription}>Resúmenes visuales para descargar y tener siempre a la mano.</Text>
                        </View>
                        <View style={styles.freeGuideBadge}>
                            <Text style={styles.freeGuideText}>GRATIS</Text>
                        </View>
                    </View>

                    <View style={styles.itemsList}>
                        {printableItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemRow}
                                onPress={() => handleSupportPress(item)}
                            >
                                <View style={styles.itemIcon}>
                                    <Ionicons
                                        name="image-outline"
                                        size={20}
                                        color={AppTheme.colors.primary}
                                    />
                                </View>
                                <Text style={styles.itemName}>{item.title}</Text>
                                <View style={styles.actionContainer}>
                                    <Ionicons name="cloud-download-outline" size={20} color={AppTheme.colors.primary} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* Visual Viewer Modal */}
            <Modal
                visible={viewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedVisual?.title}</Text>
                            <TouchableOpacity onPress={() => setViewerVisible(false)}>
                                <Ionicons name="close" size={28} color="#2c3e50" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView minimumZoomScale={1} maximumZoomScale={3} contentContainerStyle={styles.imageContainer}>
                            {selectedVisual?.image && (
                                <Image
                                    source={selectedVisual.image}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.footerAction}
                                onPress={() => {
                                    const item = supportItems.find(i => i.title === selectedVisual?.title);
                                    if (item) generatePdf(item);
                                }}
                            >
                                <Ionicons name="print-outline" size={20} color="#fff" />
                                <Text style={styles.footerActionText}>Imprimir / Compartir Guía</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
    },
    headerIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    content: {
        padding: 15,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-start',
    },
    sectionIcon: {
        marginTop: 2,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    sectionDescription: {
        fontSize: 13,
        color: '#95a5a6',
    },
    itemsList: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemIcon: {
        marginRight: 12,
    },
    itemName: {
        flex: 1,
        fontSize: 15,
        color: '#34495e',
    },
    actionContainer: {
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    premiumTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    premiumText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#e67e22',
        marginLeft: 4,
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        backgroundColor: '#fff3e0',
        padding: 10,
        borderRadius: 8,
    },
    noteText: {
        fontSize: 12,
        color: '#e67e22',
        marginLeft: 8,
        flex: 1,
    },
    downloadAllGuide: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    downloadAllText: {
        fontSize: 13,
        color: AppTheme.colors.primary,
        marginLeft: 8,
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '95%',
        height: '85%',
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    imageContainer: {
        alignItems: 'center',
        padding: 10,
    },
    fullImage: {
        width: width * 0.9,
        height: width * 1.3,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    footerAction: {
        backgroundColor: AppTheme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    footerActionText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // Vault Button Styles
    vaultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(52, 152, 219, 0.1)',
    },
    vaultIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: AppTheme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    vaultTextContainer: {
        flex: 1,
    },
    vaultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    vaultSubtitle: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
    },
    vaultPremiumTag: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 10,
    },
    vaultPremiumText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#e67e22',
    },
    freeGuideBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 'auto',
    },
    freeGuideText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2E7D32',
    }
});

export default MyChestScreen;

