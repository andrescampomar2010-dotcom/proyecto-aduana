# app.py - Aplicación de Gestión Aduanera
# Versión 1.0 - 100% Gratuita y Local

import streamlit as st
import pandas as pd
import pytesseract
import ollama
import json
import re
import os
from pdf2image import convert_from_path
from PIL import Image
import cv2
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import config

# ============================================
# CONFIGURACIÓN INICIAL
# ============================================

st.set_page_config(
    page_title="Gestor Aduanas Local",
    page_icon="📦",
    layout="wide"
)

# Configurar Tesseract
pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_PATH

# ============================================
# CARGAR MODELOS DE IA
# ============================================

@st.cache_resource
def cargar_modelo_embeddings():
    """Carga el modelo para búsqueda de partidas arancelarias"""
    return SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

@st.cache_resource
def cargar_base_partidas():
    """Carga o crea base de datos de partidas arancelarias"""
    archivo_partidas = 'partidas_arancelarias.csv'
    
    if os.path.exists(archivo_partidas):
        return pd.read_csv(archivo_partidas)
    else:
        # Base de datos mínima de ejemplo
        datos_ejemplo = {
            'partida': [
                '3926.90.99', '8471.30.00', '8517.12.00', '6403.91.00',
                '3004.90.00', '8703.23.00', '0901.21.00', '2204.21.00',
                '8528.72.00', '9403.60.00', '3923.30.00', '8415.10.00'
            ],
            'descripcion': [
                'Artículos de plástico', 'Ordenadores portátiles', 'Teléfonos móviles',
                'Calzado de cuero', 'Medicamentos', 'Vehículos automóviles',
                'Café tostado', 'Vino en botellas', 'Receptores de televisión',
                'Muebles de madera', 'Envases de plástico', 'Aire acondicionado'
            ]
        }
        df = pd.DataFrame(datos_ejemplo)
        df.to_csv(archivo_partidas, index=False)
        return df

# ============================================
# FUNCIONES DE OCR
# ============================================

def preprocesar_imagen(imagen):
    """Mejora la calidad de la imagen para OCR"""
    img_array = np.array(imagen)
    
    # Convertir a escala de grises
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # Aplicar umbralizado (blanco y negro puro)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    
    # Eliminar ruido
    denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
    
    return Image.fromarray(denoised)

def extraer_texto_de_archivo(archivo):
    """Extrae texto de PDF o imagen"""
    try:
        nombre = archivo.name.lower()
        
        if nombre.endswith('.pdf'):
            # Convertir PDF a imágenes
            images = convert_from_path(
                archivo,
                dpi=300,
                poppler_path=config.POPPLER_PATH
            )
            texto_completo = ""
            for img in images:
                img_mejorada = preprocesar_imagen(img)
                texto = pytesseract.image_to_string(img_mejorada, lang='spa+eng')
                texto_completo += texto + "\n"
            return texto_completo
            
        elif nombre.endswith(('.png', '.jpg', '.jpeg', '.tiff')):
            imagen = Image.open(archivo)
            imagen_mejorada = preprocesar_imagen(imagen)
            texto = pytesseract.image_to_string(imagen_mejorada, lang='spa+eng')
            return texto
            
        else:
            return "Formato no soportado"
            
    except Exception as e:
        return f"Error: {str(e)}"

# ============================================
# FUNCIONES DE IA
# ============================================

def extraer_datos_con_ia(texto, instrucciones):
    """Usa IA local para extraer datos estructurados"""
    
    prompt = f"""
Eres un experto en documentación aduanera. Extrae TODOS los datos de este documento.

INSTRUCCIONES ESPECÍFICAS: {instrucciones if instrucciones else 'Extrae todos los datos como despacho individual'}

DOCUMENTO:
{texto[:4000]} # Limitamos para no exceder contexto

Extrae en formato JSON ESTRICTO esta estructura:
{{
    "despachos": [
        {{
            "origen": "País de origen",
            "peso_bruto": 123,
            "peso_neto": 100.5,
            "partida_arancelaria": "1234.56.78",
            "descripcion": "Descripción del producto",
            "valor": 1000.00,
            "moneda": "EUR",
            "cantidad": 1,
            "unidad": "unidad/kg/etc"
        }}
    ],
    "notas": "Cualquier observación importante"
}}

REGLAS:
1. Peso bruto: número entero (sin decimales) a menos que se indique lo contrario
2. Si hay múltiples productos, crea múltiples entradas en "despachos"
3. Si no encuentras partida arancelaria, pon "PENDIENTE" en partida_arancelaria
4. Extrae TODOS los valores numéricos como números, no como texto

Devuelve SOLO el JSON, sin texto adicional.
"""

    try:
        response = ollama.chat(
            model=config.MODELO_IA,
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        contenido = response['message']['content']
        
        # Extraer JSON del texto
        match = re.search(r'\{.*\}', contenido, re.DOTALL)
        if match:
            json_str = match.group()
            datos = json.loads(json_str)
            return datos
        else:
            return {"error": "No se pudo extraer JSON", "raw": contenido}
            
    except Exception as e:
        return {"error": str(e)}

def buscar_partida_similar(descripcion, modelo, base_partidas):
    """Busca partida arancelaria similar usando IA semántica"""
    
    if not descripcion or descripcion == "PENDIENTE":
        return None, 0
    
    try:
        # Crear embeddings
        embedding_desc = modelo.encode([descripcion])
        embeddings_base = modelo.encode(base_partidas['descripcion'].tolist())
        
        # Calcular similitud
        similitudes = cosine_similarity(embedding_desc, embeddings_base)[0]
        
        # Obtener mejor coincidencia
        mejor_idx = np.argmax(similitudes)
        mejor_similitud = similitudes[mejor_idx]
        
        if mejor_similitud > 0.5: # Umbral de confianza
            return base_partidas.iloc[mejor_idx]['partida'], mejor_similitud
        else:
            return None, mejor_similitud
            
    except:
        return None, 0

# ============================================
# FUNCIONES DE LÓGICA ADUANERA
# ============================================

def procesar_agrupacion(datos_por_factura, instrucciones):
    """Procesa las instrucciones de agrupación de facturas"""
    
    if not instrucciones:
        # Sin instrucciones: cada factura es un despacho
        return datos_por_factura
    
    # Usar IA para interpretar instrucciones de agrupación
    prompt_agrupacion = f"""
Tengo {len(datos_por_factura)} facturas identificadas como: {list(range(1, len(datos_por_factura)+1))}

Instrucciones del usuario: "{instrucciones}"

Devuelve un JSON que indique qué facturas van juntas en cada despacho.
Ejemplo de formato:
{{
    "despacho_1": [1, 2],
    "despacho_2": [3]
}}

Devuelve SOLO el JSON.
"""

    try:
        response = ollama.chat(
            model=config.MODELO_IA,
            messages=[{'role': 'user', 'content': prompt_agrupacion}]
        )
        
        contenido = response['message']['content']
        match = re.search(r'\{.*\}', contenido, re.DOTALL)
        
        if match:
            agrupacion = json.loads(match.group())
            
            # Aplicar agrupación
            despachos_agrupados = {}
            for nombre_despacho, indices in agrupacion.items():
                items_agrupados = []
                for idx in indices:
                    if idx <= len(datos_por_factura):
                        items_agrupados.extend(datos_por_factura[idx-1].get('despachos', []))
                despachos_agrupados[nombre_despacho] = items_agrupados
            
            return despachos_agrupados
    except:
        pass
    
    # Si falla, devolver sin agrupar
    return {f"despacho_{i+1}": datos.get('despachos', []) 
            for i, datos in enumerate(datos_por_factura)}

def unificar_partidas_iguales(items):
    """Unifica valores cuando hay misma partida arancelaria"""
    
    if not items:
        return []
    
    # Agrupar por partida
    por_partida = {}
    for item in items:
        partida = item.get('partida_arancelaria', 'SIN_PARTIDA')
        if partida not in por_partida:
            por_partida[partida] = {
                'origen': item.get('origen', ''),
                'peso_bruto': 0,
                'peso_neto': 0,
                'partida_arancelaria': partida,
                'descripcion': item.get('descripcion', ''),
                'valor': 0,
                'moneda': item.get('moneda', 'EUR'),
                'cantidad': 0,
                'unidad': item.get('unidad', '')
            }
        
        # Sumar valores
        por_partida[partida]['peso_bruto'] += item.get('peso_bruto', 0) or 0
        por_partida[partida]['peso_neto'] += item.get('peso_neto', 0) or 0
        por_partida[partida]['valor'] += item.get('valor', 0) or 0
        por_partida[partida]['cantidad'] += item.get('cantidad', 0) or 0
    
    return list(por_partida.values())

def aplicar_reglas_pesos(items):
    """Aplica reglas de formato de pesos"""
    
    for item in items:
        # Peso bruto sin decimales (por defecto)
        if config.REDONDEAR_PESO_BRUTO and 'peso_bruto' in item:
            try:
                item['peso_bruto'] = int(float(item['peso_bruto']))
            except:
                pass
        
        # Peso neto puede llevar decimales (redondear a 2)
        if 'peso_neto' in item:
            try:
                item['peso_neto'] = round(float(item['peso_neto']), 2)
            except:
                pass
    
    return items

# ============================================
# FUNCIONES DE EXPORTACIÓN
# ============================================

def preparar_para_taric(df):
    """Prepara DataFrame para exportar a TARIC TRANS"""
    
    # Renombrar columnas según estándar TARIC
    mapeo_columnas = {
        'origen': 'Origen',
        'peso_bruto': 'Peso Bruto',
        'peso_neto': 'Peso Neto',
        'partida_arancelaria': 'Partida Arancelaria',
        'descripcion': 'Descripción',
        'valor': 'Valor',
        'moneda': 'Moneda',
        'cantidad': 'Cantidad',
        'unidad': 'Unidad'
    }
    
    df_export = df.rename(columns=mapeo_columnas)
    
    # Asegurar orden de columnas
    columnas_orden = ['Origen', 'Peso Bruto', 'Peso Neto', 'Partida Arancelaria', 
                      'Descripción', 'Valor', 'Moneda', 'Cantidad', 'Unidad']
    
    columnas_existentes = [c for c in columnas_orden if c in df_export.columns]
    df_export = df_export[columnas_existentes]
    
    return df_export

# ============================================
# INTERFAZ DE USUARIO
# ============================================

def main():
    st.title("📦 Gestor de Despachos Aduaneros")
    st.markdown("---")
    
    # Sidebar con información
    with st.sidebar:
        st.header("⚙️ Configuración")
        st.info(f"Modelo IA: {config.MODELO_IA}")
        st.info(f"Peso Bruto: {'Sin decimales' if config.REDONDEAR_PESO_BRUTO else 'Con decimales'}")
        
        st.markdown("---")
        st.header("📚 Ayuda")
        st.markdown("""
        **Instrucciones de agrupación:**
        - "Une factura 1 y 2"
        - "Factura 3单独"
        - "Todas juntas"
        
        **Formatos soportados:**
        - PDF
        - PNG, JPG, JPEG
        """)
        
        if st.button("📥 Descargar Plantilla Partidas"):
            base_partidas = cargar_base_partidas()
            csv = base_partidas.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="Descargar CSV",
                data=csv,
                file_name="partidas_arancelarias.csv",
                mime="text/csv"
            )
    
    # ========================================
    # SECCIÓN 1: CARGA DE DOCUMENTOS
    # ========================================
    
    st.header("1️⃣ Carga de Documentación")
    
    uploaded_files = st.file_uploader(
        "Sube facturas, albaranes o documentos (PDF/Imágenes)",
        accept_multiple_files=True,
        type=['pdf', 'png', 'jpg', 'jpeg', 'tiff']
    )
    
    if uploaded_files:
        st.success(f"✅ {len(uploaded_files)} documento(s) cargado(s)")
        
        # Mostrar vista previa
        with st.expander("📄 Ver documentos cargados"):
            for i, file in enumerate(uploaded_files):
                st.write(f"**Documento {i+1}:** {file.name} ({file.size / 1024:.1f} KB)")
    
    # ========================================
    # SECCIÓN 2: INSTRUCCIONES
    # ========================================
    
    st.header("2️⃣ Instrucciones de Procesamiento")
    
    instrucciones = st.text_area(
        "Instrucciones de agrupación (opcional)",
        placeholder="Ejemplo: 'Une las facturas 1 y 2 en un despacho. La factura 3 va por separado.'\n\nSi lo dejas vacío, cada factura será un despacho independiente.",
        height=100
    )
    
    col1, col2 = st.columns(2)
    with col1:
        peso_bruto_decimales = st.checkbox(
            "Peso bruto CON decimales",
            value=not config.REDONDEAR_PESO_BRUTO,
            help="Por defecto el peso bruto va sin decimales"
        )
    
    with col2:
        buscar_partidas_auto = st.checkbox(
            "Buscar partidas automáticamente",
            value=True,
            help="Usa IA para sugerir partidas arancelarias"
        )
    
    # ========================================
    # SECCIÓN 3: PROCESAMIENTO
    # ========================================
    
    st.header("3️⃣ Procesamiento")
    
    if st.button("🚀 Procesar Documentación", type="primary", use_container_width=True):
        
        if not uploaded_files:
            st.error("❌ Sube al menos un documento primero")
        else:
            with st.spinner('🔄 Procesando documentos... Esto puede tardar unos minutos.'):
                
                # Cargar modelos
                modelo_embeddings = cargar_modelo_embeddings()
                base_partidas = cargar_base_partidas()
                
                # Actualizar configuración
                config.REDONDEAR_PESO_BRUTO = not peso_bruto_decimales
                
                # Procesar cada documento
                datos_por_factura = []
                
                progreso = st.progress(0)
                
                for i, archivo in enumerate(uploaded_files):
                    # Extraer texto
                    texto = extraer_texto_de_archivo(archivo)
                    
                    # Extraer datos con IA
                    datos = extraer_datos_con_ia(texto, instrucciones)
                    datos['nombre_archivo'] = archivo.name
                    datos['numero_factura'] = i + 1
                    
                    # Buscar partidas si está activado
                    if buscar_partidas_auto and 'despachos' in datos:
                        for despacho in datos['despachos']:
                            if despacho.get('partida_arancelaria') == 'PENDIENTE' or not despacho.get('partida_arancelaria'):
                                partida, confianza = buscar_partida_similar(
                                    despacho.get('descripcion', ''),
                                    modelo_embeddings,
                                    base_partidas
                                )
                                if partida:
                                    despacho['partida_arancelaria'] = partida
                                    despacho['confianza_partida'] = f"{confianza:.2f}"
                    
                    datos_por_factura.append(datos)
                    progreso.progress((i + 1) / len(uploaded_files))
                
                # Procesar agrupación
                despachos_agrupados = procesar_agrupacion(datos_por_factura, instrucciones)
                
                # ========================================
                # SECCIÓN 4: RESULTADOS
                # ========================================
                
                st.header("4️⃣ Resultados")
                
                # Crear DataFrame consolidado
                todos_los_items = []
                
                for nombre_despacho, items in despachos_agrupados.items():
                    # Unificar partidas iguales
                    items_unificados = unificar_partidas_iguales(items)
                    
                    # Aplicar reglas de pesos
                    items_finales = aplicar_reglas_pesos(items_unificados)
                    
                    # Añadir identificador de despacho
                    for item in items_finales:
                        item['despacho_id'] = nombre_despacho
                        todos_los_items.append(item)
                
                if todos_los_items:
                    df = pd.DataFrame(todos_los_items)
                    
                    # Mostrar tabla editable
                    st.subheader("📋 Datos Extraídos (EDITABLE)")
                    st.info("⚠️ Revisa y corrige los datos antes de exportar. La IA puede cometer errores.")
                    
                    # Configurar editor de datos
                    df_editado = st.data_editor(
                        df,
                        use_container_width=True,
                        num_rows="dynamic",
                        column_config={
                            "peso_bruto": st.column_config.NumberColumn(
                                "Peso Bruto",
                                format="%d",
                                help="Sin decimales por defecto"
                            ),
                            "peso_neto": st.column_config.NumberColumn(
                                "Peso Neto",
                                format="%.2f",
                                help="Con 2 decimales"
                            ),
                            "valor": st.column_config.NumberColumn(
                                "Valor",
                                format="%.2f",
                                help="Valor de la partida"
                            ),
                            "partida_arancelaria": st.column_config.TextColumn(
                                "Partida Arancelaria",
                                help="Código HS de 8-10 dígitos"
                            )
                        }
                    )
                    
                    # ========================================
                    # SECCIÓN 5: EXPORTACIÓN
                    # ========================================
                    
                    st.header("5️⃣ Exportación")
                    
                    col_exp1, col_exp2, col_exp3 = st.columns(3)
                    
                    with col_exp1:
                        # Preparar para TARIC
                        df_taric = preparar_para_taric(df_editado)
                        csv_taric = df_taric.to_csv(index=False, encoding='utf-8-sig').encode('utf-8')
                        
                        st.download_button(
                            label="📥 Exportar para TARIC TRANS (CSV)",
                            data=csv_taric,
                            file_name="despacho_taric.csv",
                            mime="text/csv",
                            use_container_width=True
                        )
                    
                    with col_exp2:
                        # Exportar Excel
                        excel_buffer = pd.ExcelWriter('despacho.xlsx', engine='openpyxl')
                        df_editado.to_excel(excel_buffer, index=False, sheet_name='Despacho')
                        excel_buffer.close()
                        
                        with open('despacho.xlsx', 'rb') as f:
                            st.download_button(
                                label="📥 Exportar Excel (.xlsx)",
                                data=f.read(),
                                file_name="despacho_completo.xlsx",
                                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                use_container_width=True
                            )
                    
                    with col_exp3:
                        # Exportar JSON
                        json_str = df_editado.to_json(orient='records', force_ascii=False, indent=2)
                        st.download_button(
                            label="📥 Exportar JSON",
                            data=json_str,
                            file_name="despacho.json",
                            mime="application/json",
                            use_container_width=True
                        )
                    
                    # ========================================
                    # SECCIÓN 6: ESTADÍSTICAS
                    # ========================================
                    
                    st.header("📊 Resumen del Despacho")
                    
                    col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)
                    
                    with col_stat1:
                        st.metric(
                            "Total Valor",
                            f"{df_editado['valor'].sum():,.2f} {df_editado['moneda'].iloc[0] if 'moneda' in df_editado.columns else 'EUR'}"
                        )
                    
                    with col_stat2:
                        st.metric(
                            "Peso Bruto Total",
                            f"{df_editado['peso_bruto'].sum():,.0f} kg"
                        )
                    
                    with col_stat3:
                        st.metric(
                            "Peso Neto Total",
                            f"{df_editado['peso_neto'].sum():,.2f} kg"
                        )
                    
                    with col_stat4:
                        st.metric(
                            "Número de Partidas",
                            len(df_editado)
                        )
                    
                    # Mostrar advertencia legal
                    st.warning("""
                    ⚖️ **ADVERTENCIA LEGAL:** 
                    Los datos generados por IA deben ser verificados por un profesional. 
                    El declarante es responsable de la exactitud de la información presentada a aduanas.
                    """)
                    
                else:
                    st.error("❌ No se pudieron extraer datos de los documentos")
    
    # ========================================
    # PIE DE PÁGINA
    # ========================================
    
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: gray;'>
    <small>📦 Gestor de Despachos Aduaneros v1.0 | 100% Gratuito y Local | Los datos no salen de tu ordenador</small>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
