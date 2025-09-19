from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mysqldb import MySQL
from datetime import datetime
import MySQLdb.cursors
import os
import time

app = Flask(__name__)
CORS(app)

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'password')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'diario_personal')
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

def wait_for_mysql():
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            print("Conexión a MySQL establecida exitosamente")
            return True
        except Exception as e:
            retry_count += 1
            print(f"Esperando MySQL... intento {retry_count}/{max_retries}")
            time.sleep(2)
    
    print("Error: No se pudo conectar a MySQL después de varios intentos")
    return False

# Crear tabla si no existe
def init_db():
    try:
        if not wait_for_mysql():
            return False
            
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS entradas_diario (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha DATE NOT NULL,
                contenido TEXT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_fecha (fecha)
            )
        """)
        mysql.connection.commit()
        cursor.close()
        print("Base de datos inicializada correctamente")
        return True
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
        return False

@app.route('/api/entradas', methods=['GET'])
def obtener_entradas():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("SELECT * FROM entradas_diario ORDER BY fecha DESC")
        entradas = cursor.fetchall()
        cursor.close()
        
        # Convertir fechas a string para JSON
        for entrada in entradas:
            entrada['fecha'] = entrada['fecha'].strftime('%Y-%m-%d')
            if entrada['fecha_creacion']:
                entrada['fecha_creacion'] = entrada['fecha_creacion'].strftime('%Y-%m-%d %H:%M:%S')
            if entrada['fecha_actualizacion']:
                entrada['fecha_actualizacion'] = entrada['fecha_actualizacion'].strftime('%Y-%m-%d %H:%M:%S')
        
        return jsonify(entradas), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entradas', methods=['POST'])
def crear_entrada():
    try:
        data = request.json
        fecha = data.get('fecha')
        contenido = data.get('contenido')
        
        if not fecha or not contenido:
            return jsonify({'error': 'Fecha y contenido son requeridos'}), 400
        
        cursor = mysql.connection.cursor()
        cursor.execute(
            "INSERT INTO entradas_diario (fecha, contenido) VALUES (%s, %s)",
            (fecha, contenido)
        )
        mysql.connection.commit()
        entrada_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({'message': 'Entrada creada exitosamente', 'id': entrada_id}), 201
    except MySQLdb.IntegrityError:
        return jsonify({'error': 'Ya existe una entrada para esta fecha'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entradas/<fecha>', methods=['GET'])
def obtener_entrada_por_fecha(fecha):
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("SELECT * FROM entradas_diario WHERE fecha = %s", (fecha,))
        entrada = cursor.fetchone()
        cursor.close()
        
        if entrada:
            entrada['fecha'] = entrada['fecha'].strftime('%Y-%m-%d')
            if entrada['fecha_creacion']:
                entrada['fecha_creacion'] = entrada['fecha_creacion'].strftime('%Y-%m-%d %H:%M:%S')
            if entrada['fecha_actualizacion']:
                entrada['fecha_actualizacion'] = entrada['fecha_actualizacion'].strftime('%Y-%m-%d %H:%M:%S')
            return jsonify(entrada), 200
        else:
            return jsonify({'message': 'No se encontró entrada para esta fecha'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entradas/<fecha>', methods=['PUT'])
def actualizar_entrada(fecha):
    try:
        data = request.json
        contenido = data.get('contenido')
        
        if not contenido:
            return jsonify({'error': 'Contenido es requerido'}), 400
        
        cursor = mysql.connection.cursor()
        cursor.execute(
            "UPDATE entradas_diario SET contenido = %s WHERE fecha = %s",
            (contenido, fecha)
        )
        mysql.connection.commit()
        
        if cursor.rowcount == 0:
            cursor.close()
            return jsonify({'error': 'No se encontró entrada para esta fecha'}), 404
        
        cursor.close()
        return jsonify({'message': 'Entrada actualizada exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/entradas/<fecha>', methods=['DELETE'])
def eliminar_entrada(fecha):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM entradas_diario WHERE fecha = %s", (fecha,))
        mysql.connection.commit()
        
        if cursor.rowcount == 0:
            cursor.close()
            return jsonify({'error': 'No se encontró entrada para esta fecha'}), 404
        
        cursor.close()
        return jsonify({'message': 'Entrada eliminada exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        return jsonify({'status': 'API funcionando correctamente', 'database': 'conectada'}), 200
    except Exception as e:
        return jsonify({'status': 'API funcionando', 'database': 'error', 'error': str(e)}), 503

if __name__ == '__main__':
    print("Iniciando aplicación...")
    
    with app.app_context():
        if init_db():
            print("Aplicación lista")
        else:
            print("Error en la inicialización")
    
    app.run(debug=False, host='0.0.0.0', port=5000)