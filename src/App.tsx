/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, ChangeEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FileText, 
  Download, 
  Settings, 
  Database, 
  AlertCircle, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp, 
  Table, 
  Columns,
  RefreshCw,
  Info,
  Volume2,
  VolumeX,
  Globe,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ShieldCheck,
  Bug
} from 'lucide-react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CIVILIZATIONS, GALAXIES } from './constants';
import { Autocomplete } from './components/Autocomplete';

// Column configuration mapping
interface ColumnConfig {
  name: string;
  enabled: boolean;
  rawIndex: number;
}

type ReportType = 'simple' | 'detailed' | 'custom';

const CIV_ACRONYMS: Record<string, string> = {
  'Alliance of Galactic Travellers': 'AGT',
  'Intergalactic Travellers Foundation': 'IGTF',
  'Calypso Travellers Foundation': 'CTF',
  'Hyades Travellers Foundation': 'HTF',
  'Budullanger Travellers Foundation': 'BTF',
  'Budullangr Travellers Foundation': 'BTF',
  'Isdoraijung Travellers Foundation': 'ITF',
  'Kikolgallr Travellers Foundation': 'KTF',
  'Eissentam Travellers Foundation': 'ETF',
  'Ickjamatew Travellers Foundation': 'IJTF',
  'Rycempler Travellers Foundation': 'RTF',
  'Zavainlani Travellers Foundation': 'ZTF',
  'Animal Cracker Projects': 'ACP',
  'United Star Navy': 'USN',
  'CELAB Galactic Industries': 'CGI',
  'IVc Project': 'IVc',
  'AAAM Expeditionary': 'AAAM',
  'Riven Minerals and Exploration': 'RME',
  'Gravemind Expeditionary Force': 'GMEF'
};

type PlanetCategory = 'all' | 'giant' | 'paradise' | 'biome';

const BIOMES = [
  'Barren',
  'Dead',
  'Exotic',
  'Frozen',
  'Irradiated',
  'Gas Giant',
  'Lush',
  'Mega Exotic',
  'Scorched',
  'Toxic',
  'Marsh',
  'Volcanic',
  'Waterworld'
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "Alliance of Galactic Travellers": "Alliance of Galactic Travellers",
    "AGT Planet Report Tool": "AGT Planet Report Tool",
    "STATUS:": "STATUS:",
    "SYNCING": "SYNCING",
    "CONNECTED": "CONNECTED",
    "DISCONNECTED": "DISCONNECTED",
    "System Settings": "System Settings",
    "Close": "Close",
    "Font Scaling": "Font Scaling",
    "Rows/Page": "Rows/Page",
    "Language": "Language",
    "AGT Anthem": "AGT Anthem",
    "Active": "Active",
    "Muted": "Muted",
    "Planet DB Sync": "Planet DB Sync",
    "Re-Sync Planet DB": "Re-Sync Planet DB",
    "* Re-sync of planet DB may take up 5-10 minutes": "* Re-sync of planet DB may take up 5-10 minutes",
    "All Planets": "All Planets",
    "Giant Planets": "Giant Planets",
    "Paradise Planet": "Paradise Planet",
    "Biome Specific": "Biome Specific",
    "Simple Report": "Simple Report",
    "Detailed Report": "Detailed Report",
    "Custom Report": "Custom Report",
    "Custom Report Columns": "Custom Report Columns",
    "Civilization": "Civilization",
    "Galaxy": "Galaxy",
    "Region": "Region",
    "Discoverer": "Discoverer",
    "Surveyor": "Surveyor",
    "Biome": "Biome",
    "Select/Type Civilization...": "Select/Type Civilization...",
    "Select/Type Galaxy...": "Select/Type Galaxy...",
    "Select/Type Region...": "Select/Type Region...",
    "Select/Type Discoverer...": "Select/Type Discoverer...",
    "Select/Type Surveyor...": "Select/Type Surveyor...",
    "-- Select Biome --": "-- Select Biome --",
    "Extract Reports": "Extract Reports",
    "Reset Criteria": "Reset Criteria",
    "All": "All",
    "Clear": "Clear",
    "Data Access in Process - Please Wait": "Data Access in Process - Please Wait",
    "NOTICE:": "NOTICE:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "All fields are optional. Entries are case insensitive. No entry on them will match on all values.",
    "Extracting Galactic Archives": "Extracting Galactic Archives",
    "Syncing Galactic Archives": "Syncing Galactic Archives",
    "Generating Data Packet": "Generating Data Packet",
    "Showing Page": "Showing Page",
    "of": "of",
    "total rows": "total rows",
    "Previous": "Previous",
    "Next": "Next",
    "First": "First",
    "Last": "Last",
    "Ledger Integrity: Verified": "Ledger Integrity: Verified",
    "PDF Report": "PDF Report",
    "Download CSV": "Download CSV",
    "Total Matches": "Total Matches",
    "Report Type": "Report Type",
    "Planet Filter": "Planet Filter",
    "Planets": "Planets",
    "Report Date": "Report Date",
    // Column Headers from sheet
    "Galaxy Header": "Galaxy",
    "Region Header": "Region",
    "System Header": "System",
    "Sector Header": "Sector",
    "Biome Header": "Biome",
    "Civilization Header": "Civilization",
    "Discoverer Header": "Discoverer",
    "Discovery Date Header": "Discovery Date",
    "Surveyor Header": "Surveyor",
    "Survey Date Header": "Survey Date",
    "Platform Header": "Platform",
    "Game Mode Header": "Game Mode",
    "Game Version Header": "Game Version",
    "Wiki Link Header": "Wiki Link",
    "Planet Name Header": "Planet Name",
    "System OEB Code Header": "System OEB Code",
    // Biomes list
    "Barren": "Barren",
    "Dead": "Dead",
    "Exotic": "Exotic",
    "Frozen": "Frozen",
    "Irradiated": "Irradiated",
    "Gas Giant": "Gas Giant",
    "Lush": "Lush",
    "Mega Exotic": "Mega Exotic",
    "Scorched": "Scorched",
    "Toxic": "Toxic",
    "Marsh": "Marsh",
    "Volcanic": "Volcanic",
    "Waterworld": "Waterworld"
  },
  fr: {
    "Alliance of Galactic Travellers": "Alliance des Voyageurs Galactiques",
    "AGT Planet Report Tool": "Outil de Rapport Planétaire AGT",
    "STATUS:": "STATUT :",
    "SYNCING": "SYNCHRONISATION",
    "CONNECTED": "CONNECTÉ",
    "DISCONNECTED": "DÉCONNECTÉ",
    "System Settings": "Paramètres Système",
    "Close": "Fermer",
    "Font Scaling": "Échelle des Polices",
    "Rows/Page": "Lignes/Page",
    "Language": "Langue",
    "AGT Anthem": "Hymne de l'AGT",
    "Active": "Actif",
    "Muted": "Muet",
    "Planet DB Sync": "Sync de la BD de Planètes",
    "Re-Sync Planet DB": "Re-synchroniser la BD de Planètes",
    "* Re-sync of planet DB may take up 5-10 minutes": "* La ré-synchro de la BD peut prendre 5 à 10 minutes",
    "All Planets": "Toutes les Planètes",
    "Giant Planets": "Planètes Géantes",
    "Paradise Planet": "Planète Paradis",
    "Biome Specific": "Biome Spécifique",
    "Simple Report": "Rapport Simple",
    "Detailed Report": "Rapport Détaillé",
    "Civilization": "Civilisation",
    "Galaxy": "Galaxie",
    "Region": "Région",
    "Discoverer": "Découvreur",
    "Surveyor": "Géomètre",
    "Biome": "Biome",
    "Select/Type Civilization...": "Sélectionner/Saisir Civilisation...",
    "Select/Type Galaxy...": "Sélectionner/Saisir Galaxie...",
    "Select/Type Region...": "Sélectionner/Saisir Région...",
    "Select/Type Discoverer...": "Sélectionner/Saisir Découvreur...",
    "Select/Type Surveyor...": "Sélectionner/Saisir Géomètre...",
    "-- Select Biome --": "-- Choisir un Biome --",
    "Extract Reports": "Extraire Rapports",
    "Reset Criteria": "Réinitialiser",
    "All": "Tout",
    "Clear": "Effacer",
    "Data Access in Process - Please Wait": "Accès aux Données en Cours - Veuillez Patienter",
    "NOTICE:": "AVIS :",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "Tous les champs sont facultatifs. La casse n'est pas prise en compte. Un champ vide correspondra à toutes les valeurs.",
    "Extracting Galactic Archives": "Extraction des Archives Galactiques",
    "Syncing Galactic Archives": "Synchronisation des Archives Galactiques",
    "Generating Data Packet": "Génération de Paquet de Données",
    "Showing Page": "Affichage Page",
    "of": "sur",
    "total rows": "lignes au total",
    "Previous": "Précédent",
    "Next": "Suivant",
    "First": "Premier",
    "Last": "Dernier",
    "Ledger Integrity: Verified": "Intégrité du Registre : Vérifiée",
    "PDF Report": "Rapport PDF",
    "Download CSV": "Télécharger CSV",
    "Total Matches": "Total des Matchs",
    "Report Type": "Type de Rapport",
    "Planet Filter": "Filtre de Planète",
    "Planets": "Planètes",
    "Report Date": "Date de Rapport",
    "Galaxy Header": "Galaxie",
    "Region Header": "Région",
    "System Header": "Système",
    "Sector Header": "Secteur",
    "Biome Header": "Biome",
    "Civilization Header": "Civilisation",
    "Discoverer Header": "Découvreur",
    "Discovery Date Header": "Date de Découverte",
    "Surveyor Header": "Géomètre",
    "Survey Date Header": "Date d'Arpentage",
    "Platform Header": "Plateforme",
    "Game Mode Header": "Mode de Jeu",
    "Game Version Header": "Version de Jeu",
    "Wiki Link Header": "Lien Wiki",
    "Planet Name Header": "Nom de la Planète",
    "System OEB Code Header": "Code Système OEB",
    "Barren": "Aride",
    "Dead": "Mort",
    "Exotic": "Exotique",
    "Frozen": "Gelé",
    "Irradiated": "Irradié",
    "Gas Giant": "Géante Gazeuse",
    "Lush": "Luxuriant",
    "Mega Exotic": "Méga Exotique",
    "Scorched": "Brûlé",
    "Toxic": "Toxique",
    "Marsh": "Marécageux",
    "Volcanic": "Volcanique",
    "Waterworld": "Monde Aquatique"
  },
  es: {
    "Alliance of Galactic Travellers": "Alianza de Viajeros Galácticos",
    "AGT Planet Report Tool": "Herramienta de Reporte de Planetas AGT",
    "STATUS:": "ESTADO:",
    "SYNCING": "SINCRO",
    "CONNECTED": "CONECTADO",
    "DISCONNECTED": "DESCONECTADO",
    "System Settings": "Configuración del Sistema",
    "Close": "Cerrar",
    "Font Scaling": "Tamaño de Fuente",
    "Rows/Page": "Filas/Página",
    "Language": "Idioma",
    "AGT Anthem": "Himno de AGT",
    "Active": "Activo",
    "Muted": "Silenciado",
    "Planet DB Sync": "Sincro de BD de Planetas",
    "Re-Sync Planet DB": "Re-sincronizar BD",
    "* Re-sync of planet DB may take up 5-10 minutes": "* La sincronización puede tardar 5-10 minutos",
    "All Planets": "Todos los Planetas",
    "Giant Planets": "Planetas Gigantes",
    "Paradise Planet": "Planeta Paraíso",
    "Biome Specific": "Bioma Específico",
    "Simple Report": "Reporte Simple",
    "Detailed Report": "Reporte Detallado",
    "Civilization": "Civilización",
    "Galaxy": "Galaxia",
    "Region": "Región",
    "Discoverer": "Descubridor",
    "Surveyor": "Topógrafo",
    "Biome": "Bioma",
    "Select/Type Civilization...": "Seleccione/Escriba Civilización...",
    "Select/Type Galaxy...": "Seleccione/Escriba Galaxia...",
    "Select/Type Region...": "Seleccione/Escriba Región...",
    "Select/Type Discoverer...": "Seleccione/Escriba Descubridor...",
    "Select/Type Surveyor...": "Seleccione/Escriba Topógrafo...",
    "-- Select Biome --": "-- Seleccionar Bioma --",
    "Extract Reports": "Extraer Reportes",
    "Reset Criteria": "Restablecer",
    "All": "Todo",
    "Clear": "Limpiar",
    "Data Access in Process - Please Wait": "Acceso a Datos - Por Favor Espere",
    "NOTICE:": "AVISO:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "Todos los campos son opcionales. No distinguen mayúsculas ni minúsculas. Dejar en blanco buscará todos los valores.",
    "Extracting Galactic Archives": "Extrayendo Archivos Galácticos",
    "Syncing Galactic Archives": "Sincronizando Archivos Galácticos",
    "Generating Data Packet": "Generando Paquete de Datos",
    "Showing Page": "Mostrando Página",
    "of": "de",
    "total rows": "filas en total",
    "Previous": "Anterior",
    "Next": "Siguiente",
    "First": "Primero",
    "Last": "Último",
    "Ledger Integrity: Verified": "Integridad de Registro: Verificada",
    "PDF Report": "Reporte PDF",
    "Download CSV": "Descargar CSV",
    "Total Matches": "Total de Coincidencias",
    "Report Type": "Tipo de Reporte",
    "Planet Filter": "Filtro de Planeta",
    "Planets": "Planetas",
    "Report Date": "Fecha del Reporte",
    "Galaxy Header": "Galaxia",
    "Region Header": "Región",
    "System Header": "Sistema",
    "Sector Header": "Sector",
    "Biome Header": "Bioma",
    "Civilization Header": "Civilización",
    "Discoverer Header": "Descubridor",
    "Discovery Date Header": "Fecha de Descubrimiento",
    "Surveyor Header": "Topógrafo",
    "Survey Date Header": "Fecha de Topografía",
    "Platform Header": "Plataforma",
    "Game Mode Header": "Modo de Juego",
    "Game Version Header": "Versión del Juego",
    "Wiki Link Header": "Enlace Wiki",
    "Planet Name Header": "Nombre del Planeta",
    "System OEB Code Header": "Código Sistema OEB",
    "Barren": "Yermo",
    "Dead": "Muerto",
    "Exotic": "Exótico",
    "Frozen": "Helado",
    "Irradiated": "Irradiado",
    "Gas Giant": "Gigante Gaseoso",
    "Lush": "Exuberante",
    "Mega Exotic": "Mega Exótico",
    "Scorched": "Ardiente",
    "Toxic": "Tóxico",
    "Marsh": "Pantano",
    "Volcanic": "Volcánico",
    "Waterworld": "Mundo Acuático"
  },
  pt: {
    "Alliance of Galactic Travellers": "Aliança de Viajantes Galácticos",
    "AGT Planet Report Tool": "Ferramenta de Relatório de Planetas AGT",
    "STATUS:": "STATUS:",
    "SYNCING": "SINCRONIZANDO",
    "CONNECTED": "CONECTADO",
    "DISCONNECTED": "DESCONECTADO",
    "System Settings": "Configurações do Sistema",
    "Close": "Fechar",
    "Font Scaling": "Tamanho da Fonte",
    "Rows/Page": "Linhas/Página",
    "Language": "Idioma",
    "AGT Anthem": "Hino da AGT",
    "Active": "Ativo",
    "Muted": "Mutado",
    "Planet DB Sync": "Sincro de BD de Planetas",
    "Re-Sync Planet DB": "Re-sincronizar BD",
    "* Re-sync of planet DB may take up 5-10 minutes": "* Sincronização pode levar de 5 a 10 minutos",
    "All Planets": "Todos os Planetas",
    "Giant Planets": "Planetas Gigantes",
    "Paradise Planet": "Planeta Paraíso",
    "Biome Specific": "Bioma Específico",
    "Simple Report": "Relatório Simples",
    "Detailed Report": "Relatório Detalhado",
    "Civilization": "Civilização",
    "Galaxy": "Galáxia",
    "Region": "Região",
    "Discoverer": "Descobridor",
    "Surveyor": "Agrimensor",
    "Biome": "Bioma",
    "Select/Type Civilization...": "Selecione/Digite Civilização...",
    "Select/Type Galaxy...": "Selecione/Digite Galáxia...",
    "Select/Type Region...": "Selecione/Digite Região...",
    "Select/Type Discoverer...": "Selecione/Digite Descobridor...",
    "Select/Type Surveyor...": "Selecione/Digite Agrimensor...",
    "-- Select Biome --": "-- Selecionar Bioma --",
    "Extract Reports": "Extrair Relatórios",
    "Reset Criteria": "Limpar Filtros",
    "All": "Todos",
    "Clear": "Limpar",
    "Data Access in Process - Please Wait": "Acesso a Dados em Andamento - Aguarde",
    "NOTICE:": "RECOMENDAÇÃO:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "Todos os campos são opcionais. Diferença de maiúsculas/minúsculas é ignorada. Campos vazios correspondem a todos os valores.",
    "Extracting Galactic Archives": "Extraindo Arquivos Galácticos",
    "Syncing Galactic Archives": "Sincronizando Arquivos Galácticos",
    "Generating Data Packet": "Gerando Pacote de Dados",
    "Showing Page": "Mostrando Página",
    "of": "de",
    "total rows": "linhas no total",
    "Previous": "Anterior",
    "Next": "Próximo",
    "First": "Primeiro",
    "Last": "Último",
    "Ledger Integrity: Verified": "Integridade do Registro: Verificada",
    "PDF Report": "Relatório PDF",
    "Download CSV": "Baixar CSV",
    "Total Matches": "Total de Matches",
    "Report Type": "Tipo de Relatório",
    "Planet Filter": "Filtro de Planeta",
    "Planets": "Planetas",
    "Report Date": "Data do Relatório",
    "Galaxy Header": "Galáxia",
    "Region Header": "Região",
    "System Header": "Sistema",
    "Sector Header": "Setor",
    "Biome Header": "Bioma",
    "Civilization Header": "Civilização",
    "Discoverer Header": "Descobridor",
    "Discovery Date Header": "Data de Descoberta",
    "Surveyor Header": "Agrimensor",
    "Survey Date Header": "Data de Topografia",
    "Platform Header": "Plataforma",
    "Game Mode Header": "Modo de Jogo",
    "Game Version Header": "Versão do Jogo",
    "Wiki Link Header": "Link da Wiki",
    "Planet Name Header": "Nome do Planeta",
    "System OEB Code Header": "Código Sistema OEB",
    "Barren": "Estéril",
    "Dead": "Morto",
    "Exotic": "Exótico",
    "Frozen": "Congelado",
    "Irradiated": "Irradiado",
    "Gas Giant": "Gigante Gasoso",
    "Lush": "Exuberante",
    "Mega Exotic": "Mega Exótico",
    "Scorched": "Torrado",
    "Toxic": "Tóxico",
    "Marsh": "Pântano",
    "Volcanic": "Vulcânico",
    "Waterworld": "Mundo Aquático"
  },
  it: {
    "Alliance of Galactic Travellers": "Alleanza dei Viaggiatori Galattici",
    "AGT Planet Report Tool": "Strumento di Report Planetario AGT",
    "STATUS:": "STATO:",
    "SYNCING": "SINCRO IN CORSO",
    "CONNECTED": "CONNESSO",
    "DISCONNECTED": "DISCONNESSO",
    "System Settings": "Impostazioni di Sistema",
    "Close": "Chiudi",
    "Font Scaling": "Ridimensionamento Caratteri",
    "Rows/Page": "Righe/Pagina",
    "Language": "Lingua",
    "AGT Anthem": "Inno AGT",
    "Active": "Attivo",
    "Muted": "Silenziato",
    "Planet DB Sync": "Sincronizza Database",
    "Re-Sync Planet DB": "Sincronizza DB Pianeti",
    "* Re-sync of planet DB may take up 5-10 minutes": "* La sincronizzazione del DB può richiedere 5-10 minuti",
    "All Planets": "Tutti i Pianeti",
    "Giant Planets": "Pianeti Giganti",
    "Paradise Planet": "Pianeta Paradiso",
    "Biome Specific": "Bioma Specifico",
    "Simple Report": "Report Semplice",
    "Detailed Report": "Report Dettagliato",
    "Civilization": "Civiltà",
    "Galaxy": "Galassia",
    "Region": "Regione",
    "Discoverer": "Scopritore",
    "Surveyor": "Rilevatore",
    "Biome": "Bioma",
    "Select/Type Civilization...": "Seleziona/Digita Civiltà...",
    "Select/Type Galaxy...": "Seleziona/Digita Galassia...",
    "Select/Type Region...": "Seleziona/Digita Regione...",
    "Select/Type Discoverer...": "Seleziona/Digita Scopritore...",
    "Select/Type Surveyor...": "Seleziona/Digita Rilevatore...",
    "-- Select Biome --": "-- Seleziona Bioma --",
    "Extract Reports": "Estrai Report",
    "Reset Criteria": "Azzera Filtri",
    "All": "Tutto",
    "Clear": "Cancella",
    "Data Access in Process - Please Wait": "Accesso ai Dati in Corso - Attendere",
    "NOTICE:": "AVVISO:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "Tutti i campi sono opzionali. Non fanno differenza tra maiuscole/minuscole. Nessun inserimento corrisponderà a tutti i valori.",
    "Extracting Galactic Archives": "Estrazione Archivi Galattici",
    "Syncing Galactic Archives": "Sincronizzazione Archivi Galattici",
    "Generating Data Packet": "Generazione Pacchetto Dati",
    "Showing Page": "Pagina",
    "of": "di",
    "total rows": "righe totali",
    "Previous": "Precedente",
    "Next": "Successivo",
    "First": "Primo",
    "Last": "Ultimo",
    "Ledger Integrity: Verified": "Integrità del Registro: Verificata",
    "PDF Report": "Report PDF",
    "Download CSV": "Scarica CSV",
    "Total Matches": "Totale Corrispondenze",
    "Report Type": "Tipo di Rapporto",
    "Planet Filter": "Filtro Pianeta",
    "Planets": "Pianeti",
    "Report Date": "Data del Rapporto",
    "Galaxy Header": "Galassia",
    "Region Header": "Regione",
    "System Header": "Sistema",
    "Sector Header": "Settore",
    "Biome Header": "Bioma",
    "Civilization Header": "Civiltà",
    "Discoverer Header": "Scopritore",
    "Discovery Date Header": "Data della Scoperta",
    "Surveyor Header": "Rilevatore",
    "Survey Date Header": "Data del Rilevamento",
    "Platform Header": "Piattaforma",
    "Game Mode Header": "Modalità di Gioco",
    "Game Version Header": "Versione del Gioco",
    "Wiki Link Header": "Link Wiki",
    "Planet Name Header": "Nome del Pianeta",
    "System OEB Code Header": "Codice Sistema OEB",
    "Barren": "Arido",
    "Dead": "Morto",
    "Exotic": "Esotico",
    "Frozen": "Gelato",
    "Irradiated": "Irradiato",
    "Gas Giant": "Gigante Gassoso",
    "Lush": "Lussureggiante",
    "Mega Exotic": "Mega Esotico",
    "Scorched": "Bruciato",
    "Toxic": "Tossico",
    "Marsh": "Paludoso",
    "Volcanic": "Vulcanico",
    "Waterworld": "Mondo Acquatico"
  },
  th: {
    "Alliance of Galactic Travellers": "พันธมิตรนักเดินทางแห่งกาแล็กซี",
    "AGT Planet Report Tool": "เครื่องมือรายงานดาวเคราะห์ AGT",
    "STATUS:": "สถานะ:",
    "SYNCING": "กำลังซิงค์",
    "CONNECTED": "เชื่อมต่อแล้ว",
    "DISCONNECTED": "เชื่อมต่อล้มเหลว",
    "System Settings": "การตั้งค่าระบบ",
    "Close": "ปิด",
    "Font Scaling": "ขนาดตัวอักษร",
    "Rows/Page": "จำนวนแถวต่อหน้า",
    "Language": "ภาษา",
    "AGT Anthem": "เพลงสรรเสริญ AGT",
    "Active": "เปิดใช้งาน",
    "Muted": "ปิดเสียง",
    "Planet DB Sync": "ซิงค์ฐานข้อมูลดาวเคราะห์",
    "Re-Sync Planet DB": "ซิงค์ข้อมูลดาวเคราะห์",
    "* Re-sync of planet DB may take up 5-10 minutes": "* การซิงค์ฐานข้อมูลใหม่อาจใช้เวลา 5-10 นาที",
    "All Planets": "ดาวเคราะห์ทั้งหมด",
    "Giant Planets": "ดาวเคราะห์ยักษ์",
    "Paradise Planet": "ดาวเคราะห์พาราไดซ์",
    "Biome Specific": "เจาะจงไบโอม",
    "Simple Report": "รายงานแบบย่อ",
    "Detailed Report": "รายงานแบบละเอียด",
    "Civilization": "อารยธรรม",
    "Galaxy": "กาแล็กซี",
    "Region": "ภูมิภาค",
    "Discoverer": "ผู้ค้นพบ",
    "Surveyor": "ผู้สำรวจ",
    "Biome": "ไบโอม",
    "Select/Type Civilization...": "เลือก/พิมพ์อารยธรรม...",
    "Select/Type Galaxy...": "เลือก/พิมพ์กาแล็กซี...",
    "Select/Type Region...": "เลือก/พิมพ์ภูมิภาค...",
    "Select/Type Discoverer...": "เลือก/พิมพ์ผู้ค้นพบ...",
    "Select/Type Surveyor...": "เลือก/พิมพ์ผู้สำรวจ...",
    "-- Select Biome --": "-- เลือกไบโอม --",
    "Extract Reports": "ดึงรายงาน",
    "Reset Criteria": "รีเซ็ตตัวกรอง",
    "All": "ทั้งหมด",
    "Clear": "ล้างข้อมูล",
    "Data Access in Process - Please Wait": "กำลังเข้าถึงข้อมูล - โปรดรอสักครู่",
    "NOTICE:": "หมายเหตุ:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "ทุกช่องข้อมูลระบุหรือไม่ก็ได้ ไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่ หากไม่ระบุจะค้นหาทุกค่า",
    "Extracting Galactic Archives": "กำลังดึงข้อมูลเก็บถาวรทางดาราราศาสตร์",
    "Syncing Galactic Archives": "กำลังซิงค์คลังเก็บถาวร",
    "Generating Data Packet": "กำลังสร้างแพ็กเก็ตข้อมูล",
    "Showing Page": "กำลังแสดงหน้า",
    "of": "จากทั้งหมด",
    "total rows": "แถวทั้งหมด",
    "Previous": "ก่อนหน้า",
    "Next": "ถัดไป",
    "First": "หน้าแรก",
    "Last": "หน้าสุดท้าย",
    "Ledger Integrity: Verified": "ความสมบูรณ์ของหนังสือบัญชี: ผ่านการตรวจสอบแล้ว",
    "PDF Report": "รายงาน PDF",
    "Download CSV": "ดาวน์โหลด CSV",
    "Total Matches": "ข้อมูลที่ตรงกันทั้งหมด",
    "Report Type": "ประเภทรายงาน",
    "Planet Filter": "ตัวกรองดาวเคราะห์",
    "Planets": "ดาวเคราะห์",
    "Report Date": "วันที่รายงาน",
    "Galaxy Header": "กาแล็กซี",
    "Region Header": "ภูมิภาค",
    "System Header": "ระบบ",
    "Sector Header": "เซกเตอร์",
    "Biome Header": "ไบโอม",
    "Civilization Header": "อารยธรรม",
    "Discoverer Header": "ผู้ค้นพบ",
    "Discovery Date Header": "วันที่ค้นพบ",
    "Surveyor Header": "ผู้สำรวจ",
    "Survey Date Header": "วันที่สำรวจ",
    "Platform Header": "แพลตฟอร์ม",
    "Game Mode Header": "โหมดเกม",
    "Game Version Header": "เวอร์ชันของเกม",
    "Wiki Link Header": "ลิงก์วิกิ",
    "Planet Name Header": "ชื่อดาวเคราะห์",
    "System OEB Code Header": "รหัสระบบ OEB",
    "Barren": "แห้งแล้ง",
    "Dead": "ตายแล้ว",
    "Exotic": "แปลกประหลาด",
    "Frozen": "หนาวเย็น",
    "Irradiated": "มีกัมมันตภาพรังสี",
    "Gas Giant": "ดาวแก๊สยักษ์",
    "Lush": "ชุ่มชื้น",
    "Mega Exotic": "แปลกประหลาดสุดๆ",
    "Scorched": "แผดเผา",
    "Toxic": "มีพิษ",
    "Marsh": "บึง",
    "Volcanic": "ภูเขาไฟ",
    "Waterworld": "ดาวเคราะห์มหาสมุทร"
  },
  zh: {
    "Alliance of Galactic Travellers": "星系旅行者联盟",
    "AGT Planet Report Tool": "AGT星系报告工具",
    "STATUS:": "状态:",
    "SYNCING": "同步中",
    "CONNECTED": "已连接",
    "DISCONNECTED": "未连接",
    "System Settings": "系统设置",
    "Close": "关闭",
    "Font Scaling": "字体大小",
    "Rows/Page": "每页行数",
    "Language": "语言",
    "AGT Anthem": "AGT赞歌",
    "Active": "播放中",
    "Muted": "静音",
    "Planet DB Sync": "星球数据库同步",
    "Re-Sync Planet DB": "重新同步星球数据库",
    "* Re-sync of planet DB may take up 5-10 minutes": "* 重新同步可能需要5-10分钟",
    "All Planets": "所有星球",
    "Giant Planets": "巨型星球",
    "Paradise Planet": "乐土星球",
    "Biome Specific": "特定群落",
    "Simple Report": "简要报告",
    "Detailed Report": "详细报告",
    "Civilization": "文明群体",
    "Galaxy": "星系",
    "Region": "星区/区域",
    "Discoverer": "发现者",
    "Surveyor": "勘测员",
    "Biome": "生态群落",
    "Select/Type Civilization...": "选择或输入文明...",
    "Select/Type Galaxy...": "选择或输入星系...",
    "Select/Type Region...": "选择或输入区域...",
    "Select/Type Discoverer...": "选择或输入发现者...",
    "Select/Type Surveyor...": "选择或输入勘测员...",
    "-- Select Biome --": "-- 选择群落 --",
    "Extract Reports": "导出报告",
    "Reset Criteria": "重置条件",
    "All": "全选",
    "Clear": "清除",
    "Data Access in Process - Please Wait": "数据处理中，请稍候",
    "NOTICE:": "提示:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "所有输入项均为选填。不区分大小写。如果不填写，则默认匹配所有数值。",
    "Extracting Galactic Archives": "正在提取星际历史档案",
    "Syncing Galactic Archives": "正在同步星际档案记录",
    "Generating Data Packet": "正在生成并封包数据包",
    "Showing Page": "当前显示第",
    "of": "页，共",
    "total rows": "条总记录",
    "Previous": "上一页",
    "Next": "下一页",
    "First": "首页",
    "Last": "尾页",
    "Ledger Integrity: Verified": "账本完整性：已核实",
    "PDF Report": "PDF 报告",
    "Download CSV": "下载 CSV",
    "Total Matches": "总匹配数",
    "Report Type": "报告类型",
    "Planet Filter": "星球过滤器",
    "Planets": "星球",
    "Report Date": "报告日期",
    "Galaxy Header": "星系",
    "Region Header": "星区",
    "System Header": "恒星系",
    "Sector Header": "扇区",
    "Biome Header": "生态群落",
    "Civilization Header": "文明群体",
    "Discoverer Header": "发现者",
    "Discovery Date Header": "发现日期",
    "Surveyor Header": "勘测员",
    "Survey Date Header": "勘测日期",
    "Platform Header": "平台",
    "Game Mode Header": "游戏模式",
    "Game Version Header": "游戏版本",
    "Wiki Link Header": "百科链接",
    "Planet Name Header": "星球名称",
    "System OEB Code Header": "系统OEB代码",
    "Barren": "荒凉",
    "Dead": "死亡",
    "Exotic": "奇异",
    "Frozen": "冰封",
    "Irradiated": "辐射",
    "Gas Giant": "气态巨行星",
    "Lush": "繁茂",
    "Mega Exotic": "超级奇异",
    "Scorched": "焦土",
    "Toxic": "毒性",
    "Marsh": "沼泽",
    "Volcanic": "火山",
    "Waterworld": "海洋世界"
  },
  ja: {
    "Alliance of Galactic Travellers": "銀河旅行者同盟",
    "AGT Planet Report Tool": "AGT惑星調査報告ツール",
    "STATUS:": "ステータス:",
    "SYNCING": "同期中",
    "CONNECTED": "接続完了",
    "DISCONNECTED": "切断中",
    "System Settings": "システム設定",
    "Close": "閉じる",
    "Font Scaling": "フォントサイズ Scaling",
    "Rows/Page": "行/ページ",
    "Language": "言語",
    "AGT Anthem": "AGT賛歌",
    "Active": "再生中",
    "Muted": "ミュート",
    "Planet DB Sync": "DB同期",
    "Re-Sync Planet DB": "惑星データベースの再同期",
    "* Re-sync of planet DB may take up 5-10 minutes": "* 惑星DBの再同期には5〜10分かかる場合があります",
    "All Planets": "すべての惑星",
    "Giant Planets": "巨大惑星",
    "Paradise Planet": "楽園の惑星",
    "Biome Specific": "特定バイオーム",
    "Simple Report": "簡易レポート",
    "Detailed Report": "詳細レポート",
    "Civilization": "文明",
    "Galaxy": "銀河",
    "Region": "リージョン/星域",
    "Discoverer": "発見者",
    "Surveyor": "測量士",
    "Biome": "バイオーム",
    "Select/Type Civilization...": "文明を選択/入力...",
    "Select/Type Galaxy...": "銀河を選択/入力...",
    "Select/Type Region...": "星域を選択/入力...",
    "Select/Type Discoverer...": "発見者を選択/入力...",
    "Select/Type Surveyor...": "測量士を選択/入力...",
    "-- Select Biome --": "-- バイオームを選択 --",
    "Extract Reports": "報告データ抽出",
    "Reset Criteria": "条件クリア",
    "All": "すべて",
    "Clear": "クリア",
    "Data Access in Process - Please Wait": "データアクセス中 - お待ちください",
    "NOTICE:": "お知らせ:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "すべての項目は任意入力です。大文字小文字は区別されません。入力がない項目はすべての値に一致します。",
    "Extracting Galactic Archives": "銀河アーカイブデータの抽出中",
    "Syncing Galactic Archives": "銀河アーカイブの同期中",
    "Generating Data Packet": "データパケットを生成中",
    "Showing Page": "ページ",
    "of": "/",
    "total rows": "件の総行数",
    "Previous": "前へ",
    "Next": "次へ",
    "First": "最初へ",
    "Last": "最後へ",
    "Ledger Integrity: Verified": "元帳整合性：検証済み",
    "PDF Report": "PDF 出力",
    "Download CSV": "CSV ダウンロード",
    "Total Matches": "総検索履歴数",
    "Report Type": "レポートタイプ",
    "Planet Filter": "惑星フィルター",
    "Planets": "惑星",
    "Report Date": "レポート作成日",
    "Galaxy Header": "銀河",
    "Region Header": "リージョン",
    "System Header": "システム",
    "Sector Header": "セクター",
    "Biome Header": "バイオーム",
    "Civilization Header": "文明",
    "Discoverer Header": "発見者",
    "Discovery Date Header": "発見日",
    "Surveyor Header": "調査員",
    "Survey Date Header": "調査日",
    "Platform Header": "プラットフォーム",
    "Game Mode Header": "ゲームモード",
    "Game Version Header": "ゲームバージョン",
    "Wiki Link Header": "Wikiリンク",
    "Planet Name Header": "惑星名",
    "System OEB Code Header": "システムOEBコード",
    "Barren": "不毛",
    "Dead": "死の惑星",
    "Exotic": "エキゾチック",
    "Frozen": "凍結",
    "Irradiated": "放射線",
    "Gas Giant": "ガス巨大惑星",
    "Lush": "緑豊か",
    "Mega Exotic": "メガエキゾチック",
    "Scorched": "焦熱",
    "Toxic": "有害",
    "Marsh": "湿地",
    "Volcanic": "火山",
    "Waterworld": "海洋惑星"
  },
  hi: {
    "Alliance of Galactic Travellers": "आकाशगंगा यात्रियों का संगठन",
    "AGT Planet Report Tool": "एजीटी ग्रह रिपोर्ट प्रणाली",
    "STATUS:": "स्थिति:",
    "SYNCING": "सिंक हो रहा है",
    "CONNECTED": "कनेक्टेड",
    "DISCONNECTED": "डिस्कनेक्टेड",
    "System Settings": "सिस्टम सेटिंग्स",
    "Close": "बंद करें",
    "Font Scaling": "फॉन्ट का आकार",
    "Rows/Page": "पंक्तियाँ/पृष्ठ",
    "Language": "भाषा (Language)",
    "AGT Anthem": "एजीटी एंथम",
    "Active": "सक्रिय",
    "Muted": "म्यूट",
    "Planet DB Sync": "ग्रह डेटाबेस सिंक",
    "Re-Sync Planet DB": "ग्रह डेटाबेस फिर से सिंक करें",
    "* Re-sync of planet DB may take up 5-10 minutes": "* डेटाबेस फिर से सिंक होने में 5-10 मिनट लग सकते हैं",
    "All Planets": "सभी ग्रह",
    "Giant Planets": "विशालकाय ग्रह",
    "Paradise Planet": "स्वर्ग जैसा ग्रह",
    "Biome Specific": "विशेष बायोम",
    "Simple Report": "संक्षिप्त रिपोर्ट",
    "Detailed Report": "विस्तृत रिपोर्ट",
    "Civilization": "सभ्यता",
    "Galaxy": "आकाशगंगा",
    "Region": "क्षेत्र/रीजन",
    "Discoverer": "खोजकर्ता",
    "Surveyor": "सर्वेक्षक",
    "Biome": "बायोम",
    "Select/Type Civilization...": "सभ्यता चुनें या लिखें...",
    "Select/Type Galaxy...": "आकाशगंगा चुनें या लिखें...",
    "Select/Type Region...": "क्षेत्र चुनें या लिखें...",
    "Select/Type Discoverer...": "खोजकर्ता चुनें या लिखें...",
    "Select/Type Surveyor...": "सर्वेक्षक चुनें या लिखें...",
    "-- Select Biome --": "-- बायोम चुनें --",
    "Extract Reports": "रिपोर्ट निकालें",
    "Reset Criteria": "फ़िल्टर साफ़ करें",
    "All": "सभी",
    "Clear": "साफ़ करें",
    "Data Access in Process - Please Wait": "डेटा प्रोसेसिंग जारी है - कृपया प्रतीक्षा करें",
    "NOTICE:": "सूचना:",
    "All fields are optional. Entries are case insensitive. No entry on them will match on all values.": "सभी विवरण वैकल्पिक हैं। वे बड़े या छोटे अक्षरों के प्रति संवेदनशील नहीं हैं। खाली छोड़ने पर सभी परिणाम मिलेंगे।",
    "Extracting Galactic Archives": "आकाशगंगा पुरालेख निकाले जा रहे हैं",
    "Syncing Galactic Archives": "आकाशगंगा पुरालेख सिंक किए जा रहे हैं",
    "Generating Data Packet": "डेटा पैकेट तैयार किया जा रहा है",
    "Showing Page": "पृष्ठ",
    "of": "कुल",
    "total rows": "कुल पंक्तियाँ",
    "Previous": "पिछला",
    "Next": "अगला",
    "First": "पहला पृष्ठ",
    "Last": "अंतिम पृष्ठ",
    "Ledger Integrity: Verified": "खाता विश्वसनीयता: सत्यापित",
    "PDF Report": "पीडीएफ रिपोर्ट",
    "Download CSV": "CSV डाउनलोड करें",
    "Total Matches": "कुल मेल",
    "Report Type": "रिपोर्ट का प्रकार",
    "Planet Filter": "ग्रह फ़िल्टर",
    "Planets": "ग्रह",
    "Report Date": "रिपोर्ट की तिथि",
    "Galaxy Header": "आकाशगंगा",
    "Region Header": "क्षेत्र/रीजन",
    "System Header": "प्रणाली",
    "Sector Header": "सेक्टर",
    "Biome Header": "बायोम",
    "Civilization Header": "सभ्यता",
    "Discoverer Header": "खोजकर्ता",
    "Discovery Date Header": "खोज की तारीख",
    "Surveyor Header": "सर्वेक्षक",
    "Survey Date Header": "सर्वेक्षण की तारीख",
    "Platform Header": "प्लेटफॉर्म",
    "Game Mode Header": "गेम मोड",
    "Game Version Header": "गेम संस्करण",
    "Wiki Link Header": "विकि लिंक",
    "Planet Name Header": "ग्रह का नाम",
    "System OEB Code Header": "सिस्टम OEB कोड",
    "Barren": "बंजर",
    "Dead": "मृत ग्रह",
    "Exotic": "अनोखा",
    "Frozen": "बर्फीला",
    "Irradiated": "विकिरण युक्त",
    "Gas Giant": "गैस विशाल",
    "Lush": "हरा-भरा",
    "Mega Exotic": "महा-अनोखा",
    "Scorched": "झुलसा हुआ",
    "Toxic": "जहरीला",
    "Marsh": "दलदल",
    "Volcanic": "ज्वालामुखीय",
    "Waterworld": "जलमग्न संसार"
  }
};

const getDisplayValue = (val: any, colIdx?: number) => {

  const strVal = String(val || '').trim();
  if (colIdx === 42 && CIV_ACRONYMS[strVal]) {
    return CIV_ACRONYMS[strVal];
  }
  return strVal;
};

const formatHeaderToLines = (headerText: string, maxLen = 10, maxLines = 3): string[] => {
  const words = headerText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) continue;
    if (currentLine === "") {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxLen) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine !== "") {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines - 1);
    const rest = lines.slice(maxLines - 1).join(" ");
    kept.push(rest);
    return kept;
  }
  return lines;
};

const checkIfColumnsFitLandscape = (
  activeCols: ColumnConfig[], 
  records: any[], 
  translateHeaderFn: (name: string) => string
): boolean => {
  let totalEstimatedWidthMm = 0;
  
  for (const col of activeCols) {
    const headerText = translateHeaderFn(col.name);
    const brokenLines = formatHeaderToLines(headerText);
    const maxHeaderLineCharCount = Math.max(...brokenLines.map(line => line.length), 0);
    
    let maxCellCharCount = 0;
    const sampleRecords = records.slice(0, 100);
    for (const record of sampleRecords) {
      const displayVal = getDisplayValue(record[col.name], col.rawIndex);
      const isUrl = String(displayVal).toLowerCase().startsWith("http");
      const isTargetCol = [88, 89, 90, 91, 92, 114, 115, 116, 117, 118].includes(col.rawIndex || -1);
      const cellLen = (isUrl && isTargetCol) ? 4 : String(displayVal || '').length;
      if (cellLen > maxCellCharCount) {
        maxCellCharCount = cellLen;
      }
    }
    
    const colMaxChars = Math.max(maxHeaderLineCharCount, Math.min(maxCellCharCount, 25));
    const colWidthMm = Math.max(colMaxChars * 1.6, 15);
    totalEstimatedWidthMm += colWidthMm;
  }
  
  return totalEstimatedWidthMm <= 267;
};

const decodeXOR = (encodedText: string): string => {
  const key = 969; 
  let decoded = ""; 
  for (let i = 0; i < encodedText.length; i++) { 
    let charCode = encodedText.charCodeAt(i); 
    let originalCharCode = charCode ^ key; // XOR again to reverse
    decoded += String.fromCharCode(originalCharCode); 
  } 
  return decoded; 
};

const getSecurityLevelForValue = (val: string): number => {
  const clean = val.trim().toLowerCase();
  if (clean === 'public' || clean === '0') return 0;
  if (clean === 'private' || clean === '1') return 1;
  if (clean === 'restricted' || clean === '2') return 2;
  if (clean === "top secret" || clean === "top_secret" || clean === '3') return 3;
  if (clean === "slt restricted" || clean === "slt_restricted" || clean === '4') return 4;
  if (clean === "scc restricted" || clean === "scc_restricted" || clean === '5') return 5;
  return 0; // default/fallback
};

const getSecurityColor = (level: number): string => {
  if (level === 0) return 'rgb(42, 255, 0)';
  if (level === 1) return 'rgb(0, 244, 255)';
  if (level === 2) return 'rgb(241, 152, 226)';
  if (level === 3) return 'rgb(253, 3, 3)';
  if (level === 4) return 'rgb(255, 147, 0)';
  if (level === 5) return 'rgb(50, 135, 240)';
  return 'rgb(42, 255, 0)';
};

const getSecurityLabelOfLevel = (level: number): string => {
  if (level === 0) return 'Public';
  if (level === 1) return 'Private';
  if (level === 2) return 'Restricted';
  if (level === 3) return 'Top Secret';
  if (level === 4) return 'SLT Restricted';
  if (level === 5) return 'SCC Restricted';
  return 'Public';
};

const getRecordSecurityLevel = (row: any): number => {
  const rawRow = row._raw || [];
  // Column 98 of the sheet corresponds to zero-based index 97.
  // We check both index 97 and index 98 to be robust.
  const secVal97 = String(rawRow[97] || '').trim();
  const level97 = getSecurityLevelForValue(secVal97);
  if (level97 > 0) return level97;

  const secVal98 = String(rawRow[98] || '').trim();
  return getSecurityLevelForValue(secVal98);
};

const setCookie = (name: string, value: string, days = 365) => {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax;Secure";
};

const getCookie = (name: string): string => {
  const cName = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cName) === 0) {
      return c.substring(cName.length, c.length);
    }
  }
  return "";
};

const deleteCookie = (name: string) => {
  document.cookie = name + "=; expires=Thu, 01 Jan 1700 00:00:00 UTC; path=/;SameSite=Lax;Secure";
};

const formatCacheDate = (dateStr: string | null): { date: string; time: string } => {
  if (!dateStr) return { date: '', time: '' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    
    // dd-MMM-YYYY format
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    // HH:MM format
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return {
      date: `${day}-${month}-${year}`,
      time: `${hours}:${minutes}`
    };
  } catch (e) {
    return { date: '', time: '' };
  }
};

const DB_NAME = 'agt_galactic_archives_cache';
const STORE_NAME = 'cache_store';
const CACHE_KEY = 'csv_data';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
};

const saveCacheToIndexedDB = async (csvText: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(csvText, CACHE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IndexedDB save failed:', e);
  }
};

const getCacheFromIndexedDB = async (): Promise<string | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IndexedDB get failed:', e);
    return null;
  }
};

const clearCacheFromIndexedDB = async (): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(CACHE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IndexedDB clear failed:', e);
  }
};

export default function App() {
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('agt_language') || 'en';
  });

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || key;
  };

  const tHeader = (name: string): string => {
    const key = `${name} Header`;
    if (TRANSLATIONS[language]?.[key]) {
      return TRANSLATIONS[language][key];
    }
    if (TRANSLATIONS[language]?.[name]) {
      return TRANSLATIONS[language][name];
    }
    return name;
  };

  const [reportType, setReportType] = useState<ReportType>('simple');
  const [logoSrc, setLogoSrc] = useState<string>('/AGTicon.png');
  const [planetCategory, setPlanetCategory] = useState<PlanetCategory>('all');
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const saved = localStorage.getItem('sheet_reporter_url');
    // We want to force upgrade anyone on a non-TSV or wrong GID url
    const correctUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0jFq80ut0o5jtApdhRG8sR2CIufVn0FNcugR_7fdCIfrDRfgB9s-SvEhBAePrQCibr1RcxFVoXj7o/pub?gid=1524928332&single=true&output=tsv';
    
    // Check if the saved URL is one of the old ones or doesn't have the correct current GID
    const isOld = !saved || 
                  saved.includes('gid=0') || 
                  saved.includes('gid=354119689') || 
                  saved.includes('output=csv') ||
                  saved.includes('2PACX-1vSWiJE26JMTHgjGeZfpfTrwT1HL2ZnXIqiOVkNs-V8wtDkGE7ey0Q9hnAM-bpMhy475q45qHa09o2vC');

    if (isOld) return correctUrl;
    return saved;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    // Check if the cookie for preference exists first
    const cookiePref = getCookie("agt_audio_enabled_pref");
    if (cookiePref !== "") {
      return cookiePref === "true";
    }

    // No cookie pref exists yet. Let's see if the user is a public user.
    const verifyCookie = getCookie("agt_verify_info");
    let hasVerifiedUser = false;
    if (verifyCookie) {
      try {
        const parsed = JSON.parse(verifyCookie);
        if (parsed.name && parsed.id) {
          hasVerifiedUser = true;
        }
      } catch (_) {}
    }

    if (!hasVerifiedUser) {
      // It is a public user. Mute by default.
      return false;
    } else {
      // It is a verified user. Check localStorage first, otherwise default to true
      const saved = localStorage.getItem('agt_audio_enabled');
      return saved === null ? true : saved === 'true';
    }
  });

  const toggleAudioEnabled = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    setCookie("agt_audio_enabled_pref", String(nextVal), 365);
  };
  
  const [isUsingCache, setIsUsingCache] = useState<boolean>(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(() => {
    return localStorage.getItem('agt_cache_timestamp');
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  // Initial fetch
  useEffect(() => {
    const initFetch = async () => {
      if (!sheetUrl) return;
      
      setLoading(true);
      setProgressMessage("Syncing Galactic Archives");
      setShowProgressOverlay(true);
      
      try {
        const cachedText = await getCacheFromIndexedDB();
        if (cachedText) {
          const delimiter = sheetUrl.includes('output=tsv') ? '\t' : undefined;
          const success = await parseAndLoadCsv(cachedText, true, delimiter);
          if (success) {
            setLoading(false);
            setShowProgressOverlay(false);
            return;
          }
        }
        
        // If cache wasn't found or failed to parse, fallback to live fetchData
        await fetchData();
      } catch (e) {
        console.error('Error on initial cache load, falling back to fetch:', e);
        await fetchData();
      } finally {
        setLoading(false);
        setShowProgressOverlay(false);
      }
    };
    
    initFetch();
  }, []);

  // Background Audio Management
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioEnabled && audioRef.current) {
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('mousedown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [audioEnabled]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      if (audioEnabled) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
    localStorage.setItem('agt_audio_enabled', String(audioEnabled));
  }, [audioEnabled]);

  const handleManualPlay = () => {
    if (audioEnabled && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  };

  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('agt_font_scale');
    return saved ? parseFloat(saved) : 1;
  });

  const [civilizationsList, setCivilizationsList] = useState<string[]>(CIVILIZATIONS);
  const [galaxiesList, setGalaxiesList] = useState<string[]>(GALAXIES);
  const [regionsList, setRegionsList] = useState<string[]>([]);

  // Font Scaling Effect for desktop mode
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      const htmlEl = document.documentElement;
      if (isDesktop) {
        htmlEl.style.fontSize = fontScale === 1 ? '' : `${fontScale * 16}px`;
      } else {
        htmlEl.style.fontSize = '';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.documentElement.style.fontSize = '';
    };
  }, [fontScale]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('agt_page_size');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Synchronized scrollbar refs and state
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState<number | string>("100%");

  // Sync scroll positions
  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      if (Math.abs(tableScrollRef.current.scrollLeft - topScrollRef.current.scrollLeft) > 1) {
        tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      if (Math.abs(topScrollRef.current.scrollLeft - tableScrollRef.current.scrollLeft) > 1) {
        topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
      }
    }
  };

  const [searchKey, setSearchKey] = useState('');
  const [selectedGalaxy, setSelectedGalaxy] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedBiome, setSelectedBiome] = useState('All');
  
  // Discoverer and Surveyor filters
  const [discovererFilter, setDiscovererFilter] = useState('');
  const [surveyorFilter, setSurveyorFilter] = useState('');
  const [discoverersList, setDiscoverersList] = useState<string[]>([]);
  const [surveyorsList, setSurveyorsList] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Loading progress overlay state
  const [showProgressOverlay, setShowProgressOverlay] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [pdfErrorPopup, setPdfErrorPopup] = useState<string | null>(null);

  // Verified ID state variables
  const [verifiedName, setVerifiedName] = useState<string>(() => {
    const cookieVal = getCookie("agt_verify_info");
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        return parsed.name || "";
      } catch (_) {}
    }
    return "";
  });

  const [verifiedId, setVerifiedId] = useState<string>(() => {
    const cookieVal = getCookie("agt_verify_info");
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        return parsed.id || "";
      } catch (_) {}
    }
    return "";
  });

  const [securityLevelLabel, setSecurityLevelLabel] = useState<string>(() => {
    const cookieVal = getCookie("agt_verify_info");
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        return parsed.securityLevel || "Public";
      } catch (_) {}
    }
    return "Public";
  });

  const [securityLevel, setSecurityLevel] = useState<number>(() => {
    const cookieVal = getCookie("agt_verify_info");
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        return getSecurityLevelForValue(parsed.securityLevel || "Public");
      } catch (_) {}
    }
    return 0; // Default to Public (0)
  });

  const [travellerName, setTravellerName] = useState<string>(() => {
    const cookieVal = getCookie("agt_verify_info");
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        return parsed.name || "";
      } catch (_) {}
    }
    return "";
  });

  const [travellerId, setTravellerId] = useState<string>(() => {
    const cookieVal = getCookie("agt_verify_info");
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        return parsed.id || "";
      } catch (_) {}
    }
    return "";
  });

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<ReactNode | null>(null);
  const [infoPopup, setInfoPopup] = useState<{ title: string; message: ReactNode } | null>(null);

  const [omitPrivate, setOmitPrivate] = useState(false);
  const [omitPublic, setOmitPublic] = useState(false);

  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedRecords, setMatchedRecords] = useState<any[]>([]);
  const [omittedSecurityCount, setOmittedSecurityCount] = useState(0);

  const [sheetHeaders, setSheetHeaders] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('agt_sheet_headers') || '[]');
    } catch {
      return [];
    }
  });

  const SINGLE_COLS = [
    0, 1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 26, 
    37, 38, 39, 40, 42, 43, 45, 46, 47, 49, 53, 54, 79, 80, 81, 82, 
    83, 84, 85, 86, 87, 88, 92, 95, 96
  ];

  const GROUP_COLS: Record<string, number[]> = {
    "Primary Resource": [21, 22, 23, 24, 25],
    "Special Resource": [27, 28, 29, 30, 31],
    "Raw Ingredient": [32, 33, 34, 35, 36],
    "Weather": [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78],
    "External URL": [89, 90, 91],
    "Legacy Info": [98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117]
  };

  const [customCols, setCustomCols] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('agt_custom_cols');
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults: Record<number, boolean> = {};
    SINGLE_COLS.forEach(c => {
      defaults[c] = true;
    });
    return defaults;
  });

  const [customGroups, setCustomGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('agt_custom_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      "Primary Resource": true,
      "Special Resource": true,
      "Raw Ingredient": true,
      "Weather": true,
      "External URL": true,
      "Legacy Info": true
    };
  });

  const [customColsOpen, setCustomColsOpen] = useState(false);

  useEffect(() => {
    if (tableRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setTableWidth(entry.contentRect.width);
        }
      });
      observer.observe(tableRef.current);
      return () => observer.disconnect();
    }
  }, [matchedRecords, currentPage, pageSize, customCols, customGroups]);

  const getExcelColumnLetter = (index: number): string => {
    let letter = '';
    let temp = index;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const toggleCustomCol = (idx: number) => {
    const updated = { ...customCols, [idx]: customCols[idx] === false ? true : false };
    setCustomCols(updated);
    localStorage.setItem('agt_custom_cols', JSON.stringify(updated));
    setData([]);
    setMatchedRecords([]);
  };

  const toggleCustomGroup = (groupKey: string) => {
    const updated = { ...customGroups, [groupKey]: !customGroups[groupKey] };
    setCustomGroups(updated);
    localStorage.setItem('agt_custom_groups', JSON.stringify(updated));
    setData([]);
    setMatchedRecords([]);
  };

  const selectAllCustomCols = () => {
    const updatedCols: Record<number, boolean> = {};
    SINGLE_COLS.forEach(c => {
      updatedCols[c] = true;
    });
    setCustomCols(updatedCols);
    localStorage.setItem('agt_custom_cols', JSON.stringify(updatedCols));

    const updatedGroups: Record<string, boolean> = {};
    Object.keys(GROUP_COLS).forEach(g => {
      updatedGroups[g] = true;
    });
    setCustomGroups(updatedGroups);
    localStorage.setItem('agt_custom_groups', JSON.stringify(updatedGroups));

    setData([]);
    setMatchedRecords([]);
  };

  const clearAllCustomCols = () => {
    const updatedCols: Record<number, boolean> = {};
    SINGLE_COLS.forEach(c => {
      updatedCols[c] = false;
    });
    setCustomCols(updatedCols);
    localStorage.setItem('agt_custom_cols', JSON.stringify(updatedCols));

    const updatedGroups: Record<string, boolean> = {};
    Object.keys(GROUP_COLS).forEach(g => {
      updatedGroups[g] = false;
    });
    setCustomGroups(updatedGroups);
    localStorage.setItem('agt_custom_groups', JSON.stringify(updatedGroups));

    setData([]);
    setMatchedRecords([]);
  };

  // Helpers for image fetching and date stamps
  const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Error getting base64 image:", e);
      return "";
    }
  };

  const getSystemDateTimeStamp = () => {
    const d = new Date();
    const format2 = (val: number) => String(val).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const day = format2(d.getDate());
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = format2(d.getHours());
    const minutes = format2(d.getMinutes());
    const seconds = format2(d.getSeconds());
    
    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
  };

  const getFormattedReportDate = () => {
    const d = new Date();
    const format2 = (val: number) => String(val).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${format2(d.getDate())}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
  };

  // Save sheet URL to localStorage
  useEffect(() => {
    if (sheetUrl) {
      localStorage.setItem('sheet_reporter_url', sheetUrl);
    }
  }, [sheetUrl]);

  const verifyTravellerID = async () => {
    if (!travellerName.trim() || !travellerId.trim()) {
      setVerifyError("Please enter both Traveller Name and AGT Traveller ID.");
      return;
    }
    
    // Alphanumeric up to 42 chars
    const alphaNumRegex = /^[A-Za-z0-9\s]{1,42}$/;
    if (!alphaNumRegex.test(travellerName)) {
      setVerifyError("Traveller Name must be alphanumeric and up to 42 characters.");
      return;
    }
    
    // Alphanumeric format ########-????-#### (case-insensitive for convenience)
    const idRegex = /^[0-9]{8}-[0-9A-Za-z]{4}-[0-9]{4}$/;
    if (!idRegex.test(travellerId)) {
      setVerifyError("AGT Traveller ID must follow the ########-????-#### format (e.g., 37411005-ABC9-1234).");
      return;
    }
    
    setVerifyLoading(true);
    setVerifyError(null);
    
    try {
      const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOZq3Cl2e0aNqzXdLRe63HuM7PlqGH3HnS_-0x6P_CYnGDJlK5QvI-YjU0lNaOgLyp3uoktS4WIXyK/pub?gid=505079663&single=true&output=tsv";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Unable to contact the central verification system.");
      }
      const tsvText = await response.text();
      
      const rows = tsvText.split('\n')
        .map(line => line.split('\t'))
        .filter(row => row.length >= 2);
      
      let matchedRow: string[] | null = null;
      
      for (const row of rows) {
        const rowName = String(row[0] || '').trim();
        if (rowName.toLowerCase() === travellerName.trim().toLowerCase()) {
          matchedRow = row;
          break;
        }
      }
      
      if (!matchedRow) {
        setVerifyError(
          <>
            {"Traveller Name and ID and does not match, Please consult "}
            <a
              href="https://www.nms-agt.com/support/traveller-id"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-[#FF0500] hover:text-[#60a5fa] transition-colors"
            >
              AGT Support
            </a>
          </>
        );
        setInfoPopup({
          title: t("VERIFICATION FAILED"),
          message: t("Verification unsuccessful")
        });
        setVerifyLoading(false);
        return;
      }
      
      const rowIdEncoded = String(matchedRow[1] || '').trim();
      const decodedId = decodeXOR(rowIdEncoded).trim();
      
      if (decodedId.toLowerCase() !== travellerId.trim().toLowerCase()) {
        setVerifyError(
          <>
            {"Traveller Name and ID and does not match, Please consult "}
            <a
              href="https://www.nms-agt.com/support/traveller-id"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-[#FF0500] hover:text-[#60a5fa] transition-colors"
            >
              AGT Support
            </a>
          </>
        );
        setInfoPopup({
          title: t("VERIFICATION FAILED"),
          message: t("Verification unsuccessful")
        });
        setVerifyLoading(false);
        return;
      }
      
      // Verification Successful! Retrieve security level (C) from index 2
      const levelLabel = String(matchedRow[2] || 'Public').trim();
      const numLevel = getSecurityLevelForValue(levelLabel);
      
      const infoToSave = {
        name: travellerName.trim(),
        id: travellerId.trim(),
        securityLevel: levelLabel
      };
      
      setCookie("agt_verify_info", JSON.stringify(infoToSave), 365);
      
      // Verify saved cookie
      const savedCookie = getCookie("agt_verify_info");
      let saveError = false;
      if (savedCookie) {
        try {
          const parsed = JSON.parse(savedCookie);
          if (parsed.name !== travellerName.trim() || parsed.id !== travellerId.trim()) {
            saveError = true;
          }
        } catch (_) {
          saveError = true;
        }
      } else {
        saveError = true;
      }
      
      if (saveError) {
        setInfoPopup({
          title: t("SAVE ERROR"),
          message: t("Verification successful, setting save error")
        });
      } else {
        setVerifiedName(travellerName.trim());
        setVerifiedId(travellerId.trim());
        setSecurityLevel(numLevel);
        setSecurityLevelLabel(levelLabel);
        
        setInfoPopup({
          title: t("VERIFICATION SUCCESSFUL"),
          message: t("Verification successful, setting saved")
        });
        
        // Refresh filtering
        setTimeout(() => {
          if (data.length) {
            findRecord(data, columns);
          }
        }, 100);
      }
    } catch (err: any) {
      setVerifyError("Verification error: " + (err.message || "Unknown error"));
      setInfoPopup({
        title: t("VERIFICATION FAILED"),
        message: t("Verification unsuccessful")
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const clearTravellerID = () => {
    setTravellerName("");
    setTravellerId("");
    setVerifiedName("");
    setVerifiedId("");
    setSecurityLevel(0);
    setSecurityLevelLabel("Public");
    setVerifyError(null);
    setOmitPrivate(false);
    setOmitPublic(false);
    
    deleteCookie("agt_verify_info");
    deleteCookie("agt_audio_enabled_pref");
    setAudioEnabled(false);
    
    // Verify deletion
    const savedCookie = getCookie("agt_verify_info");
    if (!savedCookie) {
      setInfoPopup({
        title: t("CLEARING SUCCESSFUL"),
        message: t("Clearing successful")
      });
      // Re-filter results
      setTimeout(() => {
        if (data.length) {
          findRecord(data, columns, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, false);
        }
      }, 100);
    } else {
      setInfoPopup({
        title: t("CLEARING FAILED"),
        message: t("Clearing failed")
      });
    }
  };

  const parseAndLoadCsv = (
    csvText: string, 
    isFromCache: boolean, 
    delimiter?: string, 
    overrides?: { searchKey?: string; galaxy?: string; region?: string; category?: PlanetCategory; biome?: string }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        delimiter: delimiter,
        complete: async (results) => {
          const rawRows = results.data as string[][];
          if (rawRows.length < 2) {
            setError('The source sheet data is insufficient (need at least 2 rows).');
            resolve(false);
            return;
          }

          const headers = rawRows[1]; // Row 2 is headers
          setSheetHeaders(headers);
          localStorage.setItem('agt_sheet_headers', JSON.stringify(headers));
          
          // Request: A, B, C, D, M, AQ, AR, AT, AU, AV, AX, CK
          // Indices: 0, 1, 2, 3, 12, 42, 43, 45, 46, 47, 49, 88
          // Excludes Discovery Date (column AS, index 44).
          // Column AT (index 45) is after AR (43) and before AU (46).
          // Column AV (index 47) is after AU (46).
          const simpleIndices = [0, 1, 2, 3, 12, 42, 43, 45, 46, 47, 49, 88];
          const detailedHtoAQ = Array.from({ length: 42 - 7 + 1 }, (_, i) => i + 7);
          const detailedIndices = [0, 1, 2, 3, ...detailedHtoAQ, 43, 44, 46, 47, 45, 48, 49];
          
          let targetIndexes: number[];
          if (reportType === 'simple') {
            targetIndexes = simpleIndices;
          } else if (reportType === 'detailed') {
            targetIndexes = detailedIndices;
          } else {
            // Custom report: Column 4 is always first
            const activeOthers = new Set<number>();
            SINGLE_COLS.forEach(idx => {
              if (customCols[idx] !== false) {
                activeOthers.add(idx);
              }
            });
            Object.keys(GROUP_COLS).forEach(grpKey => {
              if (customGroups[grpKey]) {
                GROUP_COLS[grpKey].forEach(idx => {
                  activeOthers.add(idx);
                });
              }
            });
            const sortedOthers = Array.from(activeOthers).sort((a, b) => a - b);
            targetIndexes = [4, ...sortedOthers.filter(idx => idx !== 4)];
          }
          
          const filteredColumns = targetIndexes.map(idx => ({
            name: headers[idx] || `Col ${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? String.fromCharCode(65 + Math.floor(idx / 26) - 1) : ''}`,
            enabled: true,
            rawIndex: idx
          }));
          
          setColumns(filteredColumns);
          
          const processedData = rawRows.slice(2) // Records start at Row 3 (index 2)
            .filter(row => {
              const colA = String(row[0] || '').trim();
              const colB = String(row[1] || '').trim();
              const colC = String(row[2] || '').trim();
              
              // Skip if:
              // - Col A has SKIPROW
              // - Col C is blank or null
              // - Col A has #N/A
              // - Col B has #N/A
              if (colA.includes('SKIPROW')) return false;
              if (colC === '' || colC.toLowerCase() === 'null') return false;
              if (colA.includes('#N/A') || colB.includes('#N/A')) return false;
              
              return true;
            })
            .map(row => {
              const rowObj: any = { _raw: row }; // Keep raw row for filtering
              targetIndexes.forEach((colIdx, listIdx) => {
                const headerName = filteredColumns[listIdx].name;
                rowObj[headerName] = row[colIdx] || '';
              });
              return rowObj;
            });
          
          // Harvest unique values for search filters predictive autocompletes
          const uniqueCivs = Array.from(new Set(
            processedData
              .map(row => String((row._raw || [])[42] || '').trim())
              .filter(val => val !== '' && val !== 'null' && val !== '#N/A' && val !== '#n/a')
          )).sort();
          setCivilizationsList(uniqueCivs.length > 0 ? uniqueCivs : CIVILIZATIONS);

          const uniqueGalaxies = Array.from(new Set(
            processedData
              .map(row => String((row._raw || [])[0] || '').trim())
              .filter(val => val !== '' && val !== 'null' && val !== '#N/A' && val !== '#n/a')
          )).sort();
          setGalaxiesList(uniqueGalaxies.length > 0 ? uniqueGalaxies : GALAXIES);

          const uniqueRegions = Array.from(new Set(
            processedData
              .map(row => String((row._raw || [])[1] || '').trim())
              .filter(val => val !== '' && val !== 'null' && val !== '#N/A' && val !== '#n/a')
          )).sort();
          setRegionsList(uniqueRegions);

          const uniqueDiscoverers = Array.from(new Set(
            processedData
              .map(row => String((row._raw || [])[43] || '').trim())
              .filter(val => val !== '' && val !== 'null' && val !== '#n/a')
          )).sort();
          setDiscoverersList(uniqueDiscoverers);

          const uniqueSurveyors = Array.from(new Set(
            processedData
              .map(row => String((row._raw || [])[46] || '').trim())
              .filter(val => val !== '' && val !== 'null' && val !== '#n/a')
          )).sort();
          setSurveyorsList(uniqueSurveyors);

          setData(processedData);
          
          const currentS = overrides?.searchKey ?? searchKey;
          const currentG = overrides?.galaxy ?? selectedGalaxy;
          const currentR = overrides?.region ?? selectedRegion;
          const currentC = overrides?.category ?? planetCategory;
          const currentB = overrides?.biome ?? selectedBiome;

          findRecord(processedData, filteredColumns, currentS, currentG, currentR, currentC, currentB, discovererFilter, surveyorFilter);
          
          setIsUsingCache(isFromCache);
          
          if (!isFromCache) {
            const nowIso = new Date().toISOString();
            await saveCacheToIndexedDB(csvText);
            localStorage.setItem('agt_cache_timestamp', nowIso);
            setCacheTimestamp(nowIso);
          }
          
          resolve(true);
        },
        error: (err: any) => {
          setError(`Parsing error: ${err.message}`);
          resolve(false);
        }
      });
    });
  };

  const fetchData = async (overrides?: { searchKey?: string; galaxy?: string; region?: string; category?: PlanetCategory; biome?: string }) => {
    if (!sheetUrl) {
      setError('Please provide a Google Sheet CSV URL in settings.');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    setMatchedRecords([]);
    setProgressMessage("Syncing Galactic Archives");
    setShowProgressOverlay(true);

    try {
      // Handle the case where the user might paste a regular sheet URL instead of a pub link
      let fetchUrl = sheetUrl;
      if (sheetUrl.includes('docs.google.com/spreadsheets/') && !sheetUrl.includes('pub?')) {
        // Try to convert regular URL to CSV export if possible, 
        // though "Publish to Web" is the official way.
        if (sheetUrl.includes('/edit')) {
          fetchUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Failed to fetch sheet data. Is it published to the web?');
      
      const csvText = await response.text();
      
      const delimiter = fetchUrl.includes('output=tsv') ? '\t' : undefined;
      await parseAndLoadCsv(csvText, false, delimiter, overrides);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
      setShowProgressOverlay(false);
    }
  };

  const handleSearch = () => {
    setProgressMessage("Extracting Galactic Archives");
    setShowProgressOverlay(true);
    setTimeout(() => {
      setShowProgressOverlay(false);
      if (!data.length) {
        fetchData();
      } else {
        findRecord(data, columns);
      }
    }, 1500);
  };

  const handleClearCriteria = () => {
    setSearchKey('');
    setSelectedGalaxy('');
    setSelectedRegion('');
    setSelectedBiome('All');
    setDiscovererFilter('');
    setSurveyorFilter('');
    setError(null);
    if (data.length) {
      findRecord(data, columns, '', '', '', planetCategory, 'All', '', '');
    }
  };

  const findRecord = (
    sourceData: any[], 
    sourceCols: ColumnConfig[], 
    civTerm?: string, 
    galTerm?: string, 
    regTerm?: string, 
    catTerm?: PlanetCategory, 
    bioTerm?: string,
    discTerm?: string,
    survTerm?: string,
    optOmitPrivate?: boolean,
    optOmitPublic?: boolean
  ) => {
    const rawCivTerm = (civTerm ?? searchKey).trim();
    const currentCivTerm = rawCivTerm.toLowerCase();
    const currentGalTerm = (galTerm ?? selectedGalaxy).trim().toLowerCase();
    const currentRegTerm = (regTerm ?? selectedRegion).trim().toLowerCase();
    const currentCatTerm = catTerm ?? planetCategory;
    const currentBioTerm = (bioTerm ?? selectedBiome).trim().toLowerCase();
    const currentDiscTerm = (discTerm ?? discovererFilter).trim().toLowerCase();
    const currentSurvTerm = (survTerm ?? surveyorFilter).trim().toLowerCase();
    const activeOmitPrivate = optOmitPrivate ?? omitPrivate;
    const activeOmitPublic = optOmitPublic ?? omitPublic;

    let omittedCount = 0;

    const matches = sourceData.filter(row => {
      const rawRow = row._raw || [];
      
      // Filter by record's security level vs user's active security level
      const recordLevel = getRecordSecurityLevel(row);
      const userMaxSecurity = (verifiedName && verifiedId) ? securityLevel : 0;
      let failedSecurity = false;
      if (recordLevel > userMaxSecurity) {
        failedSecurity = true;
      }

      if (verifiedName && verifiedId) {
        if (activeOmitPrivate && recordLevel > 0) {
          failedSecurity = true;
        }
        if (activeOmitPublic && recordLevel === 0) {
          failedSecurity = true;
        }
      }
      
      // Civilization match
      const civVal = String(rawRow[42] || '').trim().toLowerCase();
      
      // Handle "All" selection or blank input
      let civMatch = currentCivTerm === 'all' || !currentCivTerm || currentCivTerm === '';

      if (!civMatch) {
        // If the user types "AGT" it should be considered the same as typing "Alliance of Galactic Travellers"
        const isUserSearchAgt = currentCivTerm === 'agt' || currentCivTerm === 'alliance of galactic travellers' || currentCivTerm === 'alliance of galactic travelers';
        if (isUserSearchAgt) {
          civMatch = civVal.includes('agt') || civVal.includes('alliance of galactic travellers') || civVal.includes('alliance of galactic travelers');
        } else {
          // Try matching the full term or any known acronyms
          const acronym = Object.entries(CIV_ACRONYMS).find(([full]) => full.toLowerCase() === currentCivTerm)?.[1]?.toLowerCase();
          civMatch = civVal.includes(currentCivTerm) || (acronym && civVal.includes(acronym));
          
          if (!civMatch && currentCivTerm.includes('traveller')) {
            const fuzzyTerm = currentCivTerm.replace(/traveller/g, 'traveler');
            civMatch = civVal.includes(fuzzyTerm);
          }
        }
      }
      
      // Galaxy match (A) - If "All" or blank, match any populated galaxy (exclude blank contents)
      const galVal = String(rawRow[0] || '').trim().toLowerCase();
      const galMatch = (currentGalTerm === 'all' || !currentGalTerm || currentGalTerm === '')
        ? (galVal !== '' && galVal !== 'null' && galVal !== '#n/a')
        : galVal.includes(currentGalTerm);
      
      // Region match (B) - If "All" or blank, match any populated region (exclude blank contents)
      const regVal = String(rawRow[1] || '').trim().toLowerCase();
      const regMatch = (currentRegTerm === 'all' || !currentRegTerm || currentRegTerm === '')
        ? (regVal !== '' && regVal !== 'null' && regVal !== '#n/a')
        : regVal.includes(currentRegTerm);

      // Discoverer match (AR - index 43)
      const discVal = String(rawRow[43] || '').trim().toLowerCase();
      const discMatch = !currentDiscTerm || discVal.includes(currentDiscTerm);

      // Surveyor match (AU - index 46)
      const survVal = String(rawRow[46] || '').trim().toLowerCase();
      const survMatch = !currentSurvTerm || survVal.includes(currentSurvTerm);
      
      // Planet Category filter
      let categoryMatch = true;
      if (currentCatTerm === 'giant') {
        const planetType = String(rawRow[10] || '').toLowerCase();
        categoryMatch = planetType.includes('giant');
      } else if (currentCatTerm === 'paradise') {
        const isParadise = String(rawRow[92] || '').trim();
        categoryMatch = isParadise === 'Yes';
      } else if (currentCatTerm === 'biome') {
        const colMBiome = String(rawRow[12] || '').trim().toLowerCase();
        
        if (currentBioTerm !== 'all' && currentBioTerm !== '') {
          categoryMatch = colMBiome === currentBioTerm;
        } else {
          const validBiomes = BIOMES.map(b => b.toLowerCase());
          categoryMatch = validBiomes.includes(colMBiome);
        }
      }

      const passesOtherFilters = civMatch && galMatch && regMatch && discMatch && survMatch && categoryMatch;

      if (passesOtherFilters && failedSecurity) {
        omittedCount++;
      }

      return passesOtherFilters && !failedSecurity;
    });

    // Sort by Galaxy then Region then Name
    const sortedMatches = [...matches].sort((a, b) => {
      const rawA = a._raw || [];
      const rawB = b._raw || [];
      
      const galA = String(rawA[0] || '').toLowerCase();
      const galB = String(rawB[0] || '').toLowerCase();
      if (galA !== galB) return galA.localeCompare(galB);
      
      const regA = String(rawA[1] || '').toLowerCase();
      const regB = String(rawB[1] || '').toLowerCase();
      if (regA !== regB) return regA.localeCompare(regB);
      
      const systemA = String(rawA[2] || '').toLowerCase();
      const systemB = String(rawB[2] || '').toLowerCase();
      return systemA.localeCompare(systemB);
    });

    setOmittedSecurityCount(omittedCount);

    if (sortedMatches.length > 0) {
      setMatchedRecords(sortedMatches);
      setCurrentPage(1);
      setError(null);
    } else {
      setMatchedRecords([]);
      setCurrentPage(1);
      setError(`No records found for the selected criteria.`);
    }
  };

  const sortedMatchedRecords = useMemo(() => {
    if (!sortField) return matchedRecords;
    return [...matchedRecords].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      const strA = String(valA || '').trim();
      const strB = String(valB || '').trim();
      
      const numA = Number(strA);
      const numB = Number(strB);
      
      if (!isNaN(numA) && !isNaN(numB) && strA !== '' && strB !== '') {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      return sortDirection === 'asc' 
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [matchedRecords, sortField, sortDirection]);

  const paginatedRecords = useMemo(() => {
    if (sortedMatchedRecords.length <= pageSize) {
      return sortedMatchedRecords;
    }
    const start = (currentPage - 1) * pageSize;
    return sortedMatchedRecords.slice(start, start + pageSize);
  }, [sortedMatchedRecords, currentPage, pageSize]);

  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldName);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(matchedRecords.length / pageSize);

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const radius = 2;
    const left = currentPage - radius;
    const right = currentPage + radius;

    pages.push(1);

    if (left > 2) {
      pages.push('...');
    }

    const start = Math.max(2, left);
    const end = Math.min(totalPages - 1, right);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const downloadFullReportPdf = async () => {
    if (matchedRecords.length === 0) return;

    const activeCols = columns.filter(col => col.enabled);
    if (reportType === 'custom' && !checkIfColumnsFitLandscape(activeCols, matchedRecords, tHeader)) {
      setPdfErrorPopup("Too many columns for PDF report. Reduce columns or download as CSV.");
      return;
    }

    setProgressMessage("Generating Data Packet");
    setShowProgressOverlay(true);

    setTimeout(async () => {
      try {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode A4 always
        
        let maxSecurityLevel = 0;
        matchedRecords.forEach(record => {
          const lvl = getRecordSecurityLevel(record);
          if (lvl > maxSecurityLevel) {
            maxSecurityLevel = lvl;
          }
        });
        const highestSecurityClassificationLabel = getSecurityLabelOfLevel(maxSecurityLevel);

        let base64Logo = "";
        try {
          base64Logo = await getBase64ImageFromUrl("/AGTIcon.png");
        } catch (logoErr) {
          console.error("Could not load base64 AGTIcon.png, trying fallback", logoErr);
        }

        // ================= COVER PAGE =================
        // logo centered horizontally and vertically adjusted for landscape
        if (base64Logo) {
          doc.addImage(base64Logo, 'PNG', 133.5, 42, 30, 30);
        } else {
          const logoImg = document.querySelector('img[alt="AGT Logo"]') as HTMLImageElement;
          if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            doc.addImage(logoImg, 'PNG', 133.5, 42, 30, 30);
          } else {
            const tempImg = new Image();
            tempImg.src = logoSrc;
            doc.addImage(tempImg, 'PNG', 133.5, 42, 30, 30);
          }
        }

        // Placement of Cover Page classification warning
        if (maxSecurityLevel >= 1) {
          doc.saveGraphicsState();
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(253, 3, 3); // red
          doc.text(`This report contains ${highestSecurityClassificationLabel} intelligence.`, 148.5, 21, { align: 'center' });
          doc.restoreGraphicsState();
        }

        // Title and report details centered on landscape width axis (297 / 2 = 148.5)
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor(255, 5, 0); // Hex #FF0500
        doc.text("AGT Planet Report", 148.5, 85, { align: 'center' });

        // Metadata block (centered, black text)
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        const formattedDate = getFormattedReportDate();
        const displayCivilization = searchKey.trim().toUpperCase() === 'AGT' ? 'Alliance of Galactic Travellers' : (searchKey || 'ALL');
        const displayGalaxy = selectedGalaxy === 'All' || !selectedGalaxy || selectedGalaxy === '' ? 'ALL' : selectedGalaxy;
        const displayRegion = selectedRegion === 'All' || !selectedRegion || selectedRegion === '' ? 'ALL' : selectedRegion;
        const displayDiscoverer = discovererFilter || 'ALL';
        const displaySurveyor = surveyorFilter || 'ALL';

        const metaLines = [
          `Report Type: ${reportType === 'simple' ? 'Simple' : reportType === 'detailed' ? 'Detailed' : 'Custom'}`,
          `Planet Filter: ${
            planetCategory === 'all' ? 'All Planets' :
            planetCategory === 'giant' ? 'Giant Planets' :
            planetCategory === 'paradise' ? 'Paradise Planets' :
            `${selectedBiome || 'All'} Planets`
          }`,
          `Civilization: ${displayCivilization}`,
          `Galaxy: ${displayGalaxy}`,
          `Region: ${displayRegion}`,
          `Discoverer: ${displayDiscoverer}`,
          `Surveyor: ${displaySurveyor}`,
          `Report Date: ${formattedDate}`
        ];

        let currentY = 103;
        metaLines.forEach(line => {
          doc.text(line, 148.5, currentY, { align: 'center' });
          currentY += 8;
        });

        // Add page break to begin page 2
        doc.addPage();

        // ================= DATA PAGES (HEADER & FOOTER) =================
        const urlMap = new Map<string, string>();
        
        const tableData = matchedRecords.map((record, rIdx) => 
          activeCols.map((col, cIdx) => {
            const rawVal = record[col.name];
            const val = getDisplayValue(rawVal, col.rawIndex);
            const valStr = String(val || '').trim();
            const isUrl = valStr.toLowerCase().startsWith('http') || String(rawVal || '').toLowerCase().startsWith('http');
            
            if (isUrl) {
              const actualUrl = valStr.toLowerCase().startsWith('http') ? valStr : String(rawVal || '').trim();
              urlMap.set(`${rIdx}-${cIdx}`, actualUrl);
              const isTargetCol = [88, 89, 90, 91, 92, 114, 115, 116, 117, 118].includes(col.rawIndex);
              return isTargetCol ? 'LINK' : valStr;
            }
            return val || '-';
          })
        );

        const countFieldName = columns[0]?.name;
        const totalRow = activeCols.map(col => {
          if (col.name === countFieldName) return `Count: ${matchedRecords.length}`;
          return '';
        });
        tableData.push(totalRow);

        autoTable(doc, {
          startY: 25,
          head: [activeCols.map(col => formatHeaderToLines(tHeader(col.name)).join('\n'))],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontSize: 7 },
          bodyStyles: { fontSize: 7, fillColor: [255, 255, 255], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          margin: { top: 25, left: 15, right: 15, bottom: 20 },
          didParseCell: (cellData) => {
            if (cellData.section === 'body') {
              cellData.cell.styles.fillColor = [255, 255, 255];
              cellData.cell.styles.textColor = [0, 0, 0];
              
              if (cellData.row.index === tableData.length - 1) {
                cellData.cell.styles.fillColor = [230, 230, 230];
                cellData.cell.styles.fontStyle = 'bold';
              }
              
              const key = `${cellData.row.index}-${cellData.column.index}`;
              const rawVal = String(cellData.cell.raw || '');
              if (urlMap.has(key) || rawVal.startsWith('http')) {
                cellData.cell.styles.textColor = [0, 0, 255];
              }
            }
          },
          didDrawCell: (cellData) => {
            const key = `${cellData.row.index}-${cellData.column.index}`;
            const url = urlMap.get(key);
            if (url && cellData.section === 'body') {
              doc.link(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, { url });
            }
          },
          didDrawPage: (pageData) => {
            const docPageNum = doc.getNumberOfPages();
            if (docPageNum > 1) {
              const reportPageNum = docPageNum - 1;
              doc.saveGraphicsState();
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0); // Black header/footer text
              
              // Header logo & text
              if (base64Logo) {
                try {
                  doc.addImage(base64Logo, 'PNG', 15, 8, 8, 8);
                } catch (logoErr) {
                  console.error(logoErr);
                }
              }
              doc.text("AGT Planet Report", 25, 13);
              
              // Header page indicator
              const numText = `Page ${reportPageNum}`;
              const pageWidth = doc.internal.pageSize.width;
              doc.text(numText, pageWidth - 15 - doc.getTextWidth(numText), 13);
              
              // Footer text
              const footerText = `Report Created on: ${new Date().toLocaleString()}`;
              doc.text(footerText, 15, doc.internal.pageSize.height - 10);

              // Place the Highest classification in the center of the footer in red
              doc.saveGraphicsState();
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(8);
              doc.setTextColor(253, 3, 3); // red
              doc.text(highestSecurityClassificationLabel, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
              doc.restoreGraphicsState();

              doc.restoreGraphicsState();
            }
          }
        });

        const dateStr = getSystemDateTimeStamp();
        const typeLabel = reportType === 'simple' ? 'Simple' : reportType === 'detailed' ? 'Detail' : 'Custom';
        const filename = `AGT Base Report-${typeLabel}-${dateStr}.pdf`;
        doc.save(filename);
      } catch (e) {
        console.error("PDF Download failed:", e);
      } finally {
        setShowProgressOverlay(false);
      }
    }, 1500);
  };

  const downloadCsv = () => {
    if (matchedRecords.length === 0) return;
    
    setProgressMessage("Generating Data Packet");
    setShowProgressOverlay(true);

    setTimeout(() => {
      try {
        const activeCols = columns.filter(col => col.enabled);
        const csvData = matchedRecords.map(record => {
          const row: any = {};
          activeCols.forEach(col => {
            row[col.name] = getDisplayValue(record[col.name], col.rawIndex);
          });
          return row;
        });
        
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const dateStr = getSystemDateTimeStamp();
        const typeLabel = reportType === 'simple' ? 'Simple' : reportType === 'detailed' ? 'Detail' : 'Custom';
        const filename = `AGT Base Report-${typeLabel}-${dateStr}.csv`;
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (e) {
        console.error("CSV Download failed:", e);
      } finally {
        setShowProgressOverlay(false);
      }
    }, 1500);
  };

  const toggleColumn = (name: string) => {
    setColumns(prev => prev.map(c => c.name === name ? { ...c, enabled: !c.enabled } : c));
  };

  const activeColumnsCount = useMemo(() => columns.filter(c => c.enabled).length, [columns]);

  const totalPoints = useMemo(() => {
    return matchedRecords.length;
  }, [matchedRecords]);

  return (
    <div 
      onMouseDown={handleManualPlay}
      onTouchStart={handleManualPlay}
      className="min-h-screen bg-[#0a0a0a] text-[#FFB451] font-sans selection:bg-[#FFB451] selection:text-black"
    >
      {/* Header */}
      <header className="border-b-2 border-[#FF0500] bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logoSrc} 
              alt="AGT Logo" 
              className="w-10 h-10 object-contain opacity-90"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (logoSrc === "/AGTicon.png" || logoSrc === "/AGTIcon.png") {
                  setLogoSrc("/api/asset-proxy?id=1h9HvAGeru6Vo7PiWdLbXmGogD8TySnnz");
                } else {
                  img.style.display = 'none';
                  if (!img.parentElement?.querySelector('.agt-fallback')) {
                    img.parentElement?.insertAdjacentHTML('afterbegin', '<div class="agt-fallback w-10 h-10 border border-[#FF0500] rounded-sm flex items-center justify-center shrink-0"><span class="text-[#FFB451] font-bold text-[10px] tracking-tighter">AGT</span></div>');
                  }
                }
              }}
            />
            <div className="flex flex-col">
              <h1 className="font-bold text-xs tracking-[0.2em] uppercase text-[#FFB451]">{t("Alliance of Galactic Travellers")}</h1>
              <span className="text-[9px] text-[#FFB451] uppercase tracking-[0.3em] font-bold">{t("AGT Planet Report Tool")}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end text-[9px] text-[#FFB451]/40 tracking-widest font-mono text-right justify-center">
              <div>
                {t("STATUS:")}{' '}
                {loading ? (
                  <span className="text-yellow-500">{t("SYNCING")}</span>
                ) : cacheTimestamp ? (
                  <span className="text-blue-500 font-bold uppercase">{t("Cached")}</span>
                ) : sheetUrl ? (
                  <span className="text-emerald-500">{t("CONNECTED")}</span>
                ) : (
                  <span className="text-[#FF0500]">{t("DISCONNECTED")}</span>
                )}
              </div>
              {cacheTimestamp && !loading && (
                <div className="text-[8px] text-[#FFB451]/60 lowercase mt-0.5 tracking-wider">
                  {formatCacheDate(cacheTimestamp).date} {formatCacheDate(cacheTimestamp).time}
                </div>
              )}
            </div>

            {verifiedName && verifiedId ? (
              <div 
                style={{
                  borderColor: getSecurityColor(securityLevel),
                  color: getSecurityColor(securityLevel),
                }}
                className="px-2.5 py-1 border-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono bg-black/40 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0"
              >
                {verifiedName.slice(0, 12)}
              </div>
            ) : (
              <div 
                style={{
                  borderColor: 'rgb(42, 255, 0)',
                  color: 'rgb(42, 255, 0)',
                }}
                className="px-2.5 py-1 border-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono bg-black/40 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0"
              >
                Public User
              </div>
            )}

            <button 
              onClick={() => window.open("https://www.nms-agt.com/support", "_blank")}
              className="p-1 hover:opacity-80 transition-all duration-300 relative group cursor-pointer"
              title="Contact Support"
              id="bug-support-btn"
            >
              <Bug className="w-7 h-7 text-[#FF0500] transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute right-0 top-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#181818] border border-[#FF0500]/50 text-[#FFB451] text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded shadow-[0_0_15px_rgba(255,5,0,0.3)] z-50 whitespace-nowrap">
                Contact Support
              </div>
            </button>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 hover:text-white transition-all duration-300 relative group cursor-pointer"
              title="Settings"
              id="settings-btn"
            >
              <Settings className="w-7 h-7 text-[#FF0500] transition-transform duration-500 ease-in-out group-hover:rotate-180" />
              {!sheetUrl && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF0500] rounded-full shadow-[0_0_10px_rgba(255,5,0,0.8)] animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Settings Dialog Overlay Pop-up Window */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#141414] border-2 border-[#FF0500] rounded-3xl p-8 flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(255,5,0,0.3)] select-none text-[#FFB451]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b-2 border-[#FF0500]/20 mb-6 shrink-0">
                <h2 className="text-lg font-bold tracking-[0.1em] uppercase text-[#FFB451] flex items-center gap-3">
                  <Settings className="w-5 h-5 text-[#FF0500]" />
                  {t("System Settings")}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-2.5 bg-[#E25530] text-white border-2 border-[#FF0500] rounded-xl text-[10px] uppercase tracking-wider font-extrabold hover:bg-[#E25530]/80 transition-all cursor-pointer shadow-[0_4px_10px_rgba(226,85,48,0.2)]"
                >
                  {t("Close")}
                </button>
              </div>

              {/* Scrollable Settings options with customized scrollbar track color E25530 */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                {/* Responsive Row for Language, Font Scaling, and Records per Page */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Language Selection Section */}
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#FFB451]" />
                      {t("Language")}
                    </h3>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        localStorage.setItem('agt_language', e.target.value);
                      }}
                      className="block w-full px-3 py-2 bg-[#1d1d1d] border-2 border-[#FF0500] rounded-xl text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all text-[#FFB451] appearance-none"
                    >
                      <option value="en" className="bg-[#1c1c1c] text-[#FFB451]">English</option>
                      <option value="fr" className="bg-[#1c1c1c] text-[#FFB451]">Français (French)</option>
                      <option value="es" className="bg-[#1c1c1c] text-[#FFB451]">Español (Spanish)</option>
                      <option value="pt" className="bg-[#1c1c1c] text-[#FFB451]">Português (Brasileiro)</option>
                      <option value="it" className="bg-[#1c1c1c] text-[#FFB451]">Italiano (Italian)</option>
                      <option value="th" className="bg-[#1c1c1c] text-[#FFB451]">ไทย (Thai)</option>
                      <option value="zh" className="bg-[#1c1c1c] text-[#FFB451]">简体中文 (Mandarin Chinese)</option>
                      <option value="ja" className="bg-[#1c1c1c] text-[#FFB451]">日本語 (Japanese)</option>
                      <option value="hi" className="bg-[#1c1c1c] text-[#FFB451]">हिन्दी (Hindi)</option>
                    </select>
                  </div>

                  {/* Font Scaling Section */}
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#FFB451]" />
                      {t("Font Scaling")}
                    </h3>
                    <select
                      value={fontScale}
                      onChange={(e) => {
                        const scale = parseFloat(e.target.value);
                        setFontScale(scale);
                        localStorage.setItem('agt_font_scale', String(scale));
                      }}
                      className="block w-full px-3 py-2 bg-[#1d1d1d] border-2 border-[#FF0500] rounded-xl text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all text-[#FFB451] appearance-none"
                    >
                      <option value={1} className="bg-[#1c1c1c] text-[#FFB451]">1x {language === 'en' ? '(default)' : ''}</option>
                      <option value={1.5} className="bg-[#1c1c1c] text-[#FFB451]">1.5x</option>
                      <option value={2} className="bg-[#1c1c1c] text-[#FFB451]">2x</option>
                      <option value={2.5} className="bg-[#1c1c1c] text-[#FFB451]">2.5x</option>
                      <option value={3} className="bg-[#1c1c1c] text-[#FFB451]">3x</option>
                    </select>
                  </div>

                  {/* Rows/Page Section */}
                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-2">
                      <Table className="w-4 h-4 text-[#FFB451]" />
                      {t("Rows/Page")}
                    </h3>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const size = parseInt(e.target.value, 10);
                        setPageSize(size);
                        localStorage.setItem('agt_page_size', String(size));
                        setCurrentPage(1);
                      }}
                      className="block w-full px-3 py-2 bg-[#1d1d1d] border-2 border-[#FF0500] rounded-xl text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all text-[#FFB451] appearance-none"
                    >
                      <option value={10} className="bg-[#1c1c1c] text-[#FFB451]">10</option>
                      <option value={15} className="bg-[#1c1c1c] text-[#FFB451]">15</option>
                      <option value={30} className="bg-[#1c1c1c] text-[#FFB451]">30</option>
                      <option value={50} className="bg-[#1c1c1c] text-[#FFB451]">50</option>
                      <option value={100} className="bg-[#1c1c1c] text-[#FFB451]">100</option>
                    </select>
                  </div>
                </div>

                {/* Custom Report Columns Curtain Accordion */}
                <div className="space-y-2 border-t border-[#FF0500]/10 pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setCustomColsOpen(!customColsOpen)}
                    className="flex items-center justify-between w-full py-2 text-xs uppercase tracking-widest font-bold text-[#FFB451] hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Columns className="w-4 h-4 text-[#FF0500]" />
                      <span>{t("Custom Report Columns")}</span>
                    </div>
                    {customColsOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#FFB451]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#FFB451]" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {customColsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden space-y-4 pt-2 pb-4 px-2 bg-black/30 border border-[#FF0500]/10 rounded-xl"
                      >
                        {/* Always included notice & Selection Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#FF0500]/5 pb-2">
                          <div className="text-[10px] text-[#FFB451]/60 font-mono tracking-wider uppercase">
                            {t("Note: Planet name is always included first")}
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={selectAllCustomCols}
                              className="px-2.5 py-1 bg-[#1a1a1a] border border-[#FF0500]/40 text-[#FFB451] hover:bg-[#FF0500]/10 hover:text-white rounded text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer"
                            >
                              {t("All")}
                            </button>
                            <button
                              type="button"
                              onClick={clearAllCustomCols}
                              className="px-2.5 py-1 bg-[#1a1a1a] border border-[#FF0500]/40 text-[#FFB451] hover:bg-[#FF0500]/10 hover:text-white rounded text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer"
                            >
                              {t("Clear")}
                            </button>
                          </div>
                        </div>

                        {/* Group Column Toggles */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-[#FF0500] tracking-widest">
                            {t("Group Toggles")}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.keys(GROUP_COLS).map(grpKey => (
                              <label
                                key={grpKey}
                                className="flex items-center gap-2 p-2 bg-[#1d1d1d]/60 border border-[#FF0500]/15 hover:border-[#FF0500]/40 rounded-lg cursor-pointer transition-all select-none text-[10px] font-bold text-[#FFB451]"
                              >
                                <input
                                  type="checkbox"
                                  checked={customGroups[grpKey] !== false}
                                  onChange={() => toggleCustomGroup(grpKey)}
                                  className="accent-[#FF0500] h-3.5 w-3.5 rounded cursor-pointer shrink-0"
                                />
                                <span className="truncate">{grpKey}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Individual Column Toggles */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-[#FF0500] tracking-widest">
                            {t("Individual Column Toggles")}
                          </h4>
                          <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar border border-[#FF0500]/5 p-2 rounded-lg bg-black/10">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {SINGLE_COLS.map((colIdx) => {
                                const headerName = sheetHeaders[colIdx] || `Col ${getExcelColumnLetter(colIdx)}`;
                                const isEnabled = customCols[colIdx] !== false;
                                return (
                                  <label
                                    key={colIdx}
                                    className="flex items-center gap-2 p-1.5 hover:bg-[#FF0500]/5 rounded cursor-pointer select-none transition-all text-ellipsis overflow-hidden"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isEnabled}
                                      onChange={() => toggleCustomCol(colIdx)}
                                      className="accent-[#FF0500] h-3 w-3 rounded cursor-pointer shrink-0"
                                    />
                                    <span className="text-[9px] font-mono text-[#FFB451]/95 truncate">{headerName}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* AGT Traveller Registration System */}
                <div className="space-y-4 pb-4 border-b border-[#FF0500]/10 pt-2 text-left">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#FFB451]" />
                    <span>{t("AGT Traveller Registration")}</span>
                  </h3>

                  <div className="space-y-3 font-mono text-xs">
                    {/* Traveller Name field */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-[#FFB451]/80">
                        {t("Traveller Name")} (Alphanumeric, up to 42 chars)
                      </label>
                      <input
                        type="text"
                        value={travellerName}
                        maxLength={42}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^A-Za-z0-9\s]/g, ""); // Allow alphanumeric + spaces
                          setTravellerName(val);
                        }}
                        placeholder="e.g. Apollo"
                        className="block w-full px-3 py-2 bg-[#1d1d1d] border-2 border-[#FF0500]/30 rounded-xl focus:outline-none focus:border-[#FF0500]/80 transition-all text-[#FFB451]"
                      />
                    </div>

                    {/* AGT Traveller ID field */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-[#FFB451]/80">
                        {t("AGT Traveller ID")} (########-????-####)
                      </label>
                      <input
                        type="text"
                        value={travellerId}
                        onChange={(e) => setTravellerId(e.target.value)}
                        placeholder="e.g. 37411005-ABC9-1234"
                        className="block w-full px-3 py-2 bg-[#1d1d1d] border-2 border-[#FF0500]/30 rounded-xl focus:outline-none focus:border-[#FF0500]/80 transition-all text-[#FFB451]"
                      />
                    </div>

                    {/* Security Clearance Status Badge after AGT Traveller ID field, right-justified */}
                    <div className="flex justify-end pt-1">
                      <div 
                        style={{ 
                          borderColor: getSecurityColor(verifiedName && verifiedId ? securityLevel : 0),
                          color: getSecurityColor(verifiedName && verifiedId ? securityLevel : 0),
                        }}
                        className="px-3 py-1.5 border-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-black/40 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-1.5 font-mono"
                      >
                        <span 
                          style={{
                            backgroundColor: getSecurityColor(verifiedName && verifiedId ? securityLevel : 0),
                            boxShadow: `0 0 8px ${getSecurityColor(verifiedName && verifiedId ? securityLevel : 0)}`
                          }}
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                        />
                        <span>
                          {verifiedName && verifiedId ? (
                            securityLevel === 0 ? "Public (0)" :
                            securityLevel === 1 ? "Private (1)" :
                            securityLevel === 2 ? "Restricted (2)" :
                            securityLevel === 3 ? "Top Secret (3)" :
                            securityLevel === 4 ? "SLT Restricted (4)" :
                            securityLevel === 5 ? "SCC Restricted (5)" : "Public (0)"
                          ) : (
                            "Public User (0)"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Error status with links */}
                    {verifyError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 text-white font-sans text-xs rounded-lg leading-relaxed">
                        {verifyError}
                      </div>
                    )}

                    {/* Process Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1 font-sans">
                      <button
                        type="button"
                        onClick={verifyTravellerID}
                        disabled={verifyLoading}
                        className="flex-1 py-2.5 bg-[#FF0500] hover:bg-[#FF0500]/80 disabled:bg-[#FF0500]/40 text-white font-extrabold tracking-wider border-2 border-[#FF0500] rounded-xl text-[10px] uppercase transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(255,5,0,0.2)] text-center flex items-center justify-center gap-1.5"
                      >
                        {verifyLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t("Verifying...")}
                          </>
                        ) : (
                          t("Verify ID")
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={clearTravellerID}
                        className="py-2.5 px-4 bg-[#1a1a1a] hover:bg-black/40 text-[#FFB451] hover:text-white font-extrabold tracking-wider border-2 border-[#FF0500]/30 hover:border-[#FF0500]/80 rounded-xl text-[10px] uppercase transition-all duration-300 cursor-pointer text-center"
                      >
                        {t("Clear Settings")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* AGT Anthem Audio System */}
                <div className="space-y-2 pb-4 border-b border-[#FF0500]/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#FFB451]" />
                        {t("AGT Anthem")}
                      </h3>
                    </div>
                    <button 
                      type="button"
                      onClick={toggleAudioEnabled}
                      className="px-6 py-3 bg-[#E25530] text-white border-2 border-[#FF0500] hover:bg-[#E25530]/80 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,5,0,0.15)]"
                    >
                      {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      {audioEnabled ? t("Active") : t("Muted")}
                    </button>
                  </div>
                </div>

                {/* Planet DB Sync Section */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#FFB451]" />
                    {t("Planet DB Sync")}
                  </h3>
                  <div className="space-y-2">
                    <button 
                      type="button"
                      onClick={() => {
                        fetchData();
                        setShowSettings(false);
                      }}
                      className="w-full py-4 bg-[#E25530] text-white border-2 border-[#FF0500] hover:bg-[#E25530]/80 rounded-xl text-[10px] uppercase tracking-widest font-black transition-colors cursor-pointer text-center block shadow-[0_0_15px_rgba(255,5,0,0.15)]"
                    >
                      {t("Re-Sync Planet DB")}
                    </button>
                    {cacheTimestamp && (
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest text-center mt-1 font-mono">
                        Last Cache: {formatCacheDate(cacheTimestamp).date} {formatCacheDate(cacheTimestamp).time}
                      </p>
                    )}
                    <p className="text-[9px] text-[#FFB451]/70 uppercase tracking-widest pr-2 leading-relaxed">
                      {t("* Re-sync of planet DB may take up 5-10 minutes")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 pt-6 pb-16">
        <div className="flex justify-end">
          <button
            onClick={() => window.open("https://www.nms-agt.com/contribute", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/90 rounded-lg text-[8px] uppercase tracking-[0.2em] font-black transition-all shadow-[0_2px_10px_rgba(226,85,48,0.15)] active:scale-[0.98] cursor-pointer"
          >
            Contribute
          </button>
        </div>

        <div className="flex flex-col gap-16 mt-6">
          
          {/* Main Search Logic Container - centered aesthetic */}
          <div className="flex flex-col items-center space-y-8">
            <div className="w-full max-w-xl text-center space-y-6 flex flex-col items-center">
              <img 
                src="/src/planets-icon.png" 
                alt="Planets Icon" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "https://www.nms-agt.com/favicon.ico";
                }}
              />
              <h2 className="text-4xl font-light tracking-tight text-[#FFB451]" id="main-title">{t("AGT Planet Report Tool")}</h2>
              
              {/* Category selector */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 w-full">
                {[
                  { id: 'all', label: 'All Planets' },
                  { id: 'giant', label: 'Giant Planets' },
                  { id: 'paradise', label: 'Paradise Planet' },
                  { id: 'biome', label: 'Biome Specific' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setPlanetCategory(cat.id as PlanetCategory);
                      if (data.length) findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, cat.id as PlanetCategory);
                    }}
                    className={`px-4 py-3 rounded-xl text-[9px] uppercase tracking-widest font-bold transition-all border-2 ${
                      planetCategory === cat.id 
                        ? 'bg-[#E25530] text-white border-[#FF0500] shadow-lg' 
                        : 'bg-[#E25530]/20 text-[#FFB451] border-[#FF0500]/20 hover:bg-[#E25530]/40'
                    }`}
                  >
                    {t(cat.label)}
                  </button>
                ))}
              </div>

              {/* Report Mode Selector */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex flex-wrap md:flex-nowrap p-1 bg-black/40 border-2 border-[#FF0500] rounded-xl gap-1">
                  <button
                    onClick={() => {
                      setReportType('simple');
                      setData([]);
                      setMatchedRecords([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                      reportType === 'simple' 
                        ? 'bg-[#E25530] text-white shadow-lg' 
                        : 'text-[#FFB451] hover:bg-[#E25530]/10'
                    }`}
                  >
                    {t("Simple Report")}
                  </button>
                  <button
                    onClick={() => {
                      setReportType('detailed');
                      setData([]);
                      setMatchedRecords([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                      reportType === 'detailed' 
                        ? 'bg-[#E25530] text-white shadow-lg' 
                        : 'text-[#FFB451] hover:bg-[#E25530]/10'
                    }`}
                  >
                    {t("Detailed Report")}
                  </button>
                  <button
                    onClick={() => {
                      setReportType('custom');
                      setData([]);
                      setMatchedRecords([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                      reportType === 'custom' 
                        ? 'bg-[#E25530] text-white shadow-lg' 
                        : 'text-[#FFB451] hover:bg-[#E25530]/10'
                    }`}
                  >
                    {t("Custom Report")}
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction Note */}
            <div className="w-full max-w-5xl px-2 mb-2 flex justify-center text-center">
              <p className="text-[11px] md:text-xs font-mono tracking-wider text-[#FFB451]/80 italic bg-[#FF0500]/5 border border-[#FF0500]/20 rounded-xl py-3 px-5 inline-block text-center">
                <span className="text-[#FF0500] font-black mr-2">{t("NOTICE:")}</span>
                {t("All fields are optional. Entries are case insensitive. No entry on them will match on all values.")}
              </p>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Civilization Autocomplete with Specific Title Label Above */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFB451] pl-2">
                  {t("Civilization")}
                </label>
                <Autocomplete
                  id="civilization-select"
                  value={searchKey}
                  placeholder={t("Select/Type Civilization...")}
                  suggestions={civilizationsList}
                  icon={<Search className="h-5 w-5 text-[#FFB451]" />}
                  onChange={(val) => {
                    setSearchKey(val);
                    if (data.length) {
                      findRecord(data, columns, val, selectedGalaxy, selectedRegion, planetCategory, selectedBiome, discovererFilter, surveyorFilter);
                    } else {
                      fetchData({ searchKey: val });
                    }
                  }}
                />
              </div>

              {/* Galaxy Autocomplete with Specific Title Label Above */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFB451] pl-2">
                  {t("Galaxy")}
                </label>
                <Autocomplete
                  id="galaxy-select"
                  value={selectedGalaxy}
                  placeholder={t("Select/Type Galaxy...")}
                  suggestions={galaxiesList}
                  icon={<Globe className="h-5 w-5 text-[#FFB451]" />}
                  onChange={(val) => {
                    setSelectedGalaxy(val);
                    if (data.length) {
                      findRecord(data, columns, searchKey, val, selectedRegion, planetCategory, selectedBiome, discovererFilter, surveyorFilter);
                    }
                  }}
                />
              </div>

              {/* Region Autocomplete with Specific Title Label Above */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFB451] pl-2">
                  {t("Region")}
                </label>
                <Autocomplete
                  id="region-select"
                  value={selectedRegion}
                  placeholder={t("Select/Type Region...")}
                  suggestions={regionsList}
                  icon={<Database className="h-5 w-5 text-[#FFB451]" />}
                  onChange={(val) => {
                    setSelectedRegion(val);
                    if (data.length) {
                      findRecord(data, columns, searchKey, selectedGalaxy, val, planetCategory, selectedBiome, discovererFilter, surveyorFilter);
                    }
                  }}
                />
              </div>

              {/* Discoverer Autocomplete */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFB451] pl-2">
                  {t("Discoverer")}
                </label>
                <Autocomplete
                  id="discoverer-select"
                  value={discovererFilter}
                  placeholder={t("Select/Type Discoverer...")}
                  suggestions={discoverersList}
                  icon={<Search className="h-5 w-5 text-[#FFB451]" />}
                  onChange={(val) => {
                    setDiscovererFilter(val);
                    if (data.length) {
                      findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedBiome, val, surveyorFilter);
                    }
                  }}
                />
              </div>

              {/* Surveyor Autocomplete */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFB451] pl-2">
                  {t("Surveyor")}
                </label>
                <Autocomplete
                  id="surveyor-select"
                  value={surveyorFilter}
                  placeholder={t("Select/Type Surveyor...")}
                  suggestions={surveyorsList}
                  icon={<Search className="h-5 w-5 text-[#FFB451]" />}
                  onChange={(val) => {
                    setSurveyorFilter(val);
                    if (data.length) {
                      findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedBiome, discovererFilter, val);
                    }
                  }}
                />
              </div>

              {/* Security Omit Checkboxes, after surveyor filter criteria */}
              {verifiedName && verifiedId && (
                <div id="security-omit-checkboxes-container" className="flex flex-col gap-2 sm:col-span-2 md:col-span-3 bg-[#FF0500]/5 border border-[#FF0500]/10 p-4 rounded-3xl mt-2">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFB451] mb-1 pl-1">
                    {t("Security Classification Filters")}
                  </span>
                  <div className="flex flex-wrap gap-6 items-center">
                    <label className="flex items-center gap-2.5 text-white/90 cursor-pointer font-mono text-xs select-none hover:text-white">
                      <input
                        type="checkbox"
                        checked={omitPrivate}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setOmitPrivate(checked);
                          if (checked) {
                            setOmitPublic(false);
                          }
                          if (data.length) {
                            findRecord(
                              data,
                              columns,
                              searchKey,
                              selectedGalaxy,
                              selectedRegion,
                              planetCategory,
                              selectedBiome,
                              discovererFilter,
                              surveyorFilter,
                              checked,
                              checked ? false : omitPublic
                            );
                          }
                        }}
                        className="w-4.5 h-4.5 accent-[#FF0500] rounded focus:ring-1 focus:ring-[#FF0500] bg-[#1d1d1d] border-white/20 cursor-pointer"
                      />
                      <span>{t("Omit Private Records")}</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-white/90 cursor-pointer font-mono text-xs select-none hover:text-white">
                      <input
                        type="checkbox"
                        checked={omitPublic}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setOmitPublic(checked);
                          if (checked) {
                            setOmitPrivate(false);
                          }
                          if (data.length) {
                            findRecord(
                              data,
                              columns,
                              searchKey,
                              selectedGalaxy,
                              selectedRegion,
                              planetCategory,
                              selectedBiome,
                              discovererFilter,
                              surveyorFilter,
                              checked ? false : omitPrivate,
                              checked
                            );
                          }
                        }}
                        className="w-4.5 h-4.5 accent-[#FF0500] rounded focus:ring-1 focus:ring-[#FF0500] bg-[#1d1d1d] border-white/20 cursor-pointer"
                      />
                      <span>{t("Omit Public Records")}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Biome Search - Only if category is biome */}
              {planetCategory === 'biome' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFB451] pl-2">
                    {t("Biome")}
                  </label>
                  <div className="relative group w-full">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-[#FFB451] group-focus-within:text-[#FFB451] transition-colors">
                      <Table className="h-5 w-5 text-[#FFB451]" />
                    </div>
                    <select
                      value={selectedBiome}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBiome(val);
                        if (data.length) {
                          findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, val, discovererFilter, surveyorFilter);
                        }
                      }}
                      className="block w-full pl-14 pr-12 py-5 bg-[#1d1d1d] border-2 border-[#FF0500] rounded-full text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all input-glow text-[#FFB451] appearance-none shadow-[0_0_30px_rgba(255,180,81,0.05)] font-bold cursor-pointer"
                      id="biome-select"
                    >
                      <option value="All" className="bg-[#1d1d1d] text-[#FFB451]">-- {t("-- Select Biome --")} --</option>
                      {BIOMES.map(biome => (
                        <option key={biome} value={biome} className="bg-[#1d1d1d] text-[#FFB451]">{t(biome)}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 inset-y-0 flex items-center pointer-events-none text-[#FFB451]">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-3 border-2 border-[#FF0500] bg-[#E25530] text-white rounded-full font-black text-xs uppercase tracking-[0.15em] hover:bg-[#E25530]/90 active:scale-[0.96] disabled:opacity-25 disabled:pointer-events-none shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(255,5,0,0.4)] transition-all flex flex-row items-center justify-center gap-2.5 cursor-pointer w-full sm:w-auto min-w-[180px]"
                id="fetch-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span className="text-[9px] tracking-[0.05em] text-white">{t("Data Access in Process - Please Wait")}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span>{t("Extract Reports")}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClearCriteria}
                disabled={loading}
                className="px-6 py-3 border-2 border-[#FFB451]/30 hover:border-[#FFB451] bg-[#1a1a1a]/80 hover:bg-black text-[#FFB451] rounded-full font-black text-xs uppercase tracking-[0.15em] active:scale-[0.96] disabled:opacity-25 disabled:pointer-events-none shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(255,180,81,0.15)] transition-all flex flex-row items-center justify-center gap-2.5 cursor-pointer w-full sm:w-auto min-w-[150px]"
                id="clear-btn"
              >
                <RefreshCw className="w-4 h-4 text-[#FFB451] rotate-180" />
                <span>{t("Reset Criteria")}</span>
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-6 py-3 bg-[#FF0500]/5 border border-[#FF0500] text-[#FFB451] rounded-full text-xs font-medium tracking-wide"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#FFB451]" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>

          <div className="space-y-12">
            {/* Results Section - Full Width for Table */}
            <div className="w-full">
              <AnimatePresence mode="wait">
                {matchedRecords.length > 0 ? (
                  <motion.section
                    key="results"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="glass-card rounded-2xl overflow-hidden border-2 border-[#FF0500] bg-[#141414] shadow-[0_0_40px_rgba(255,5,0,0.05)]"
                  >
                    <div className="p-8 border-b-2 border-[#FF0500] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#181818]">
                      <div className="space-y-1">
                        <h3 className="text-xl font-medium text-[#FFB451] flex flex-wrap items-center gap-3">
                          {t("AGT Galactic Archives Results")}
                          <span className="px-3 py-1 rounded-full bg-[#FF0500]/10 text-[10px] text-[#FFB451] border-2 border-[#FF0500] font-mono font-bold">
                            {matchedRecords.length} {t("FOUND")}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#FF0500]/10 text-[10px] text-[#FFB451] border-2 border-[#FF0500] font-mono font-bold">
                            {omittedSecurityCount} {t("OMITTED")}
                          </span>
                        </h3>
                        <p className="text-[10px] text-[#FFB451] uppercase tracking-[0.2em] font-bold">{t("Verified Galactic Ledger Matches")}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {(reportType === 'simple' || reportType === 'custom') && (
                          <button
                            onClick={downloadFullReportPdf}
                            className="flex items-center gap-3 px-6 py-3 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/90 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black transition-all shadow-[0_4px_20px_rgba(226,85,48,0.2)] active:scale-[0.98] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-white" />
                            <span>{t("PDF Report")}</span>
                          </button>
                        )}
                        <button
                          onClick={downloadCsv}
                          className="flex items-center gap-3 px-6 py-3 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/90 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black transition-all shadow-[0_4px_20px_rgba(226,85,48,0.2)] active:scale-[0.98] cursor-pointer"
                        >
                          <Table className="w-3.5 h-3.5 text-white" />
                          <span>{t("Download CSV")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Top Scrollbar synchronized with the bottom scrollbar */}
                    <div 
                      ref={topScrollRef} 
                      className="overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#181818] border-b border-[#FF0500]/10" 
                      onScroll={handleTopScroll}
                    >
                      <div style={{ width: typeof tableWidth === 'number' ? `${tableWidth}px` : tableWidth }} className="h-[8px]"></div>
                    </div>

                    <div 
                      ref={tableScrollRef}
                      onScroll={handleTableScroll}
                      className="max-h-[600px] overflow-y-auto overflow-x-auto custom-scrollbar relative"
                    >
                      <table ref={tableRef} className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#181818] z-30 shadow-[0_2px_15px_rgba(0,0,0,0.6)]">
                          <tr className="bg-[#FF0500]/10 border-b-2 border-[#FF0500]">
                            {columns.filter(col => col.enabled).map((col, idx) => {
                              const headerLines = formatHeaderToLines(tHeader(col.name));
                              return (
                                <th 
                                  key={idx} 
                                  onClick={() => handleSort(col.name)}
                                  className="py-1.5 px-3 text-[9px] uppercase tracking-widest font-black text-[#FFB451] cursor-pointer select-none hover:text-white hover:bg-black/20 transition-all"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex flex-col leading-tight">
                                      {headerLines.map((line, lIdx) => (
                                        <span key={lIdx} className="whitespace-nowrap">{line}</span>
                                      ))}
                                    </div>
                                    {sortField === col.name ? (
                                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#FF0500] shadow-[0_0_8px_rgba(255,5,0,0.8)] flex-shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-[#FF0500] shadow-[0_0_8px_rgba(255,5,0,0.8)] flex-shrink-0" />
                                    ) : (
                                      <ArrowUpDown className="w-3.5 h-3.5 text-[#FFB451]/30 hover:text-[#FFB451] flex-shrink-0" />
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FF0500]/10">
                          {paginatedRecords.map((record, rIdx) => (
                            <tr key={rIdx} className="hover:bg-[#FF0500]/5 transition-colors group">
                              {columns.filter(col => col.enabled).map((col, cIdx) => (
                                <td key={cIdx} className="py-0.5 px-3 text-[10px] text-[#FFB451] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                  {(() => {
                                    const val = getDisplayValue(record[col.name], col.rawIndex);
                                    const isUrl = String(val).toLowerCase().startsWith("http");
                                    if (isUrl) {
                                      const isTargetCol = [88, 89, 90, 91, 92, 114, 115, 116, 117, 118].includes(col.rawIndex);
                                      return (
                                        <a 
                                          href={val} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-[#3b82f6] hover:text-[#60a5fa] hover:underline font-bold transition-all"
                                        >
                                          {isTargetCol ? "LINK" : val}
                                        </a>
                                      );
                                    }
                                    return val || <span className="text-[#FFB451]/45 italic">-</span>;
                                  })()}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-[#181818] border-t-2 border-[#FF0500] z-20">
                          <tr>
                            {columns.filter(col => col.enabled).map((col, idx) => (
                              <td key={idx} className="py-1.5 px-3 text-[10px] font-bold text-[#FFB451]">
                                {col.name === columns[0]?.name ? (
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-[#FFB451] uppercase tracking-tighter font-bold">{t("Total Matches")}</span>
                                    <span>{matchedRecords.length}</span>
                                  </div>
                                ) : null}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Glowing Navigation Bar right below the table */}
                    {matchedRecords.length > pageSize && (
                      <div className="p-5 border-t border-[#FF0500]/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-black/60 shadow-[0_0_25px_rgba(255,5,0,0.15)]">
                        {/* Page Range Display on the left */}
                        <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] font-bold text-[#FFB451] font-mono">
                          {t("Showing Page")} <span className="text-white font-extrabold">{currentPage}</span> {t("of")} <span className="text-white font-extrabold">{totalPages}</span> <span className="text-[#FFB451]/55">( {matchedRecords.length} {t("total rows")} )</span>
                        </div>

                        {/* Responsive Controls on the right */}
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                          {/* First Button */}
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-3.5 py-2.5 border-2 border-[#FF0500] rounded-xl text-[9px] uppercase tracking-[0.2em] font-black bg-[#E25530] text-white hover:bg-[#E25530]/80 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-[0.97] cursor-pointer"
                          >
                            {t("First")}
                          </button>

                          {/* Prev Button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3.5 py-2.5 border-2 border-[#FF0500] rounded-xl text-[9px] uppercase tracking-[0.2em] font-black bg-[#E25530] text-white hover:bg-[#E25530]/80 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-[0.97] cursor-pointer"
                          >
                            {t("Prev")}
                          </button>

                          {/* Page Numbers with Radius = 2 */}
                          <div className="flex items-center gap-1">
                            {getVisiblePages().map((page, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (typeof page === 'number') {
                                    setCurrentPage(page);
                                  }
                                }}
                                disabled={typeof page !== 'number'}
                                className={`w-8.5 h-8.5 flex-shrink-0 flex items-center justify-center rounded-xl text-[10px] font-mono transition-all border-2 ${
                                  typeof page !== 'number'
                                    ? 'text-[#FFB451]/40 border-transparent pointer-events-none'
                                    : currentPage === page
                                      ? 'bg-[#E25530] text-white border-[#FF0500] shadow-[0_0_20px_#FF0500,0_0_10px_#E25530] ring-4 ring-[#E25530]/30 font-black scale-105'
                                      : 'bg-[#E25530]/20 text-[#FFB451] border-[#FF0500]/20 hover:bg-[#E25530]/40'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3.5 py-2.5 border-2 border-[#FF0500] rounded-xl text-[9px] uppercase tracking-[0.2em] font-black bg-[#E25530] text-white hover:bg-[#E25530]/80 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-[0.97] cursor-pointer"
                          >
                            {t("Next")}
                          </button>

                          {/* Last Button */}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3.5 py-2.5 border-2 border-[#FF0500] rounded-xl text-[9px] uppercase tracking-[0.2em] font-black bg-[#E25530] text-white hover:bg-[#E25530]/80 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-[0.97] cursor-pointer"
                          >
                            {t("Last")}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-6 border-t border-[#FF0500]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#FF0500]/[0.01]">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {loading ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse" />
                          ) : isUsingCache ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                          ) : data && data.length > 0 ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF0500] shadow-[0_0_8px_rgba(255,5,0,0.8)] animate-pulse" />
                          )}
                          <span className="text-[9px] uppercase tracking-widest text-[#FFB451] font-bold">{t("Ledger Integrity: Verified")}</span>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                ) : !loading && (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-20 border border-[#FF0500]/10 rounded-2xl bg-[#FF0500]/[0.01]"
                  >
                    <div className="w-16 h-16 rounded-full border border-[#FF0500]/20 flex items-center justify-center">
                      <Database className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium uppercase tracking-[0.2em]">{t("Terminal Ready")}</p>
                      <p className="text-xs font-light">{t("Report Generation Sequence Pending Civilization Selection")}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="bg-[#FFB451] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center gap-6 text-black">
          <div className="flex flex-wrap justify-center items-center gap-y-2 text-[10px] uppercase tracking-[0.2em] font-bold">
            <a href="https://www.nms-agt.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Home</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/about-the-agt" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">About</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/team" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Team</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/contribute" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Contribute</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/agt-galactic-archives" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Galactic Archives</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/engage" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Engage</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/agt-navi" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">AGT NAVI</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/terms" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Terms</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/support" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Support</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/terms/copyright" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Copyright</a>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] font-bold">&copy; 2026 Alliance of Galactic Travellers</p>
        </div>
      </footer>

      {/* Background Audio */}
      <audio 
        ref={audioRef}
        src="/src/AGT Anthem (Instrumental).mp3"
        loop
        preload="auto"
      />

      {/* Database Sync / Export / Extraction Progress Overlay */}
      {showProgressOverlay && (
        <div className="fixed inset-0 bg-[#070707]/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <img 
                src="/AGTIcon.png" 
                alt="Rotating AGT Symbol" 
                className="w-24 h-24 object-contain animate-spin-horizontal" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== logoSrc) {
                    img.src = logoSrc;
                  }
                }}
              />
            </div>
            <p className="text-[#FF0500] text-sm md:text-base font-black uppercase tracking-[0.25em] font-mono drop-shadow-[0_0_12px_rgba(255,5,0,0.4)] max-w-md px-4">
              {t(progressMessage)}
            </p>
          </div>
        </div>
      )}

      {/* PDF Error Modal Overlay Popup */}
      <AnimatePresence>
        {pdfErrorPopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#141414] border-2 border-[#FF0500] rounded-3xl p-6 flex flex-col shadow-[0_0_50px_rgba(255,5,0,0.5)] select-none text-center text-[#FFB451] font-mono"
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FF0500]/10 flex items-center justify-center border border-[#FF0500]/30 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-[#FF0500]" />
                </div>
                <h2 className="text-sm font-extrabold tracking-widest text-[#FF0500] uppercase">
                  {t("REPORT CANCELLED")}
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-6 font-semibold">
                {pdfErrorPopup}
              </p>

              <div className="flex justify-center">
                <button
                  type="button"
                  id="pdf-error-close-btn"
                  onClick={() => setPdfErrorPopup(null)}
                  className="px-6 py-2.5 bg-[#FF0500] hover:bg-[#FF0500]/80 text-white font-extrabold tracking-wider border-2 border-[#FF0500] rounded-xl text-xs uppercase transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(255,5,0,0.4)]"
                >
                  {t("Close")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AGT Verification/Clearing Info Modal */}
      <AnimatePresence>
        {infoPopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#141414] border-2 border-[#FF0500] rounded-3xl p-6 flex flex-col shadow-[0_0_50px_rgba(255,5,0,0.4)] select-none text-center text-[#FFB451] font-mono"
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FF0500]/10 flex items-center justify-center border border-[#FF0500]/30 animate-pulse">
                  <ShieldCheck className="w-6 h-6 text-[#FFB451]" />
                </div>
                <h2 className="text-sm font-extrabold tracking-widest text-[#FFB451] uppercase">
                  {infoPopup.title}
                </h2>
              </div>

              <div className="text-xs sm:text-sm text-white/90 leading-relaxed mb-6 font-semibold">
                {infoPopup.message}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  id="info-popup-close-btn"
                  onClick={() => setInfoPopup(null)}
                  className="px-6 py-2.5 bg-[#FF0500] hover:bg-[#FF0500]/80 text-white font-extrabold tracking-wider border-2 border-[#FF0500] rounded-xl text-[10px] uppercase transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(255,5,0,0.4)]"
                >
                  {t("Close")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

