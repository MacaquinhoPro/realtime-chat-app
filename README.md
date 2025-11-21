# Parcial Final – Patrones Arquitectónicos Avanzados  
# Real-Time Chat Application  
Universidad de La Sabana  
Programa de Ingeniería Informática  
Materia: Patrones Arquitectónicos Avanzados  
Docente: Daniel Saavedra

Integrantes:  
- Juan Pablo Restrepo  
- Andrés Ricaurte  

---

## 1. Descripción General del Proyecto

Este proyecto corresponde al desarrollo completo del sistema solicitado en el parcial final del curso Patrones Arquitectónicos Avanzados. El objetivo fue diseñar e implementar una aplicación de mensajería en tiempo real basada en salas públicas y privadas, aplicando una arquitectura distribuida con componentes desacoplados, un broker de mensajería, un servidor WebSocket, un API REST y un frontend web moderno.

Todos los requisitos funcionales, no funcionales, arquitectónicos y de documentación exigidos en el enunciado fueron implementados en su totalidad. El sistema se entregó con una arquitectura mínima completa, pruebas, métricas de desempeño, un simulador de carga, una colección de Postman y un documento técnico.

---

## 2. Requerimientos Funcionales Implementados

1. Autenticación básica mediante usuario y contraseña.
2. Creación de salas públicas y privadas.
3. Ingreso y salida de salas.
4. Envío y recepción de mensajes en tiempo real.
5. Sincronización mediante broker RabbitMQ.
6. Persistencia de mensajes en PostgreSQL.
7. Disponibilidad de un historial para cada sala, con paginación.
8. Notificaciones al entrar o salir de una sala.
9. Control de acceso para salas privadas mediante contraseña.
10. Interface web con todas las funciones operativas.

Todos estos requerimientos operan tanto por REST como por WebSocket según el caso.

---

## 3. Requerimientos No Funcionales Implementados

1. **Concurrencia:**  
   El sistema soporta múltiples usuarios simultáneos conectados a distintas salas.
2. **Baja latencia:**  
   Se realizaron pruebas con el simulador desarrollado en Python, validando que la latencia promedio esté por debajo del umbral esperado (<850 ms bajo carga moderada).
3. **Durabilidad:**  
   Los mensajes se consideran entregados únicamente cuando han sido procesados por el broker y persistidos en la base de datos.
4. **Escalabilidad horizontal:**  
   La arquitectura con RabbitMQ, WebSocket y API REST desacoplados permite ejecutar múltiples instancias.
5. **Observabilidad:**  
   Se incorporó un endpoint básico de métricas, logs estructurados y estadísticas de tráfico.

---

## 4. Arquitectura del Sistema

El sistema se diseñó siguiendo la arquitectura mínima exigida por el enunciado:

- **Cliente Web (React + Vite):** interfaz del usuario.
- **API REST (Node.js + Express + TypeScript):** autenticación, administración de salas e historial de mensajes.
- **Servidor WebSocket (Socket.IO):** comunicación en tiempo real.
- **Broker de Mensajería (RabbitMQ):** canal intermedio para desacoplar el envío de mensajes.
- **Base de Datos (PostgreSQL):** almacenamiento persistente de usuarios, salas y mensajes.
- **Simulador (Python):** herramienta para pruebas de carga y medición de latencia.
- **Docker Compose:** orquestación de todos los servicios.

Se incluyen además ADRs documentando decisiones de arquitectura, modelo de datos, diseño de flujos y endpoints.

---

## 5. Estructura del Proyecto

```
/
├─ backend/              Servidor REST + WebSocket + integración con RabbitMQ y PostgreSQL
├─ frontend/             Cliente web en React + Vite + Tailwind
├─ infra/                Archivos de despliegue y docker-compose
├─ scripts/              Simulador de carga en Python
```

---

## 6. Componentes Principales

### 6.1 Backend (Node.js + TypeScript)

Incluye:
- API REST para autenticación, salas, historial.
- Servidor WebSocket con autenticación.
- Integración completa con RabbitMQ.
- Persistencia de mensajes.
- Middleware, controladores, servicios y pruebas unitarias.

### 6.2 Frontend (React + Vite + Tailwind)

Incluye:
- Login y registro.
- Listado de salas.
- Creación de salas públicas y privadas.
- Ingreso y salida.
- Pantalla de chat en tiempo real.
- Historial y paginación.
- Notificaciones de eventos.

### 6.3 RabbitMQ

- Exchange tipo topic: `chat.exchange`.
- Routing key: `room.<id>.message`.
- Consumidores para distribuir mensajes a los WebSockets y persistirlos.

### 6.4 PostgreSQL

Tablas:
- users
- rooms
- room_members
- messages

### 6.5 Simulador de Carga

- Desarrollado en Python.
- Simula múltiples usuarios.
- Envía mensajes en paralelo.
- Mide latencia desde emisión hasta recepción.

---

## 7. Instrucciones de Ejecución

### 7.1 Requisitos Previos

- Docker y Docker Compose instalados.
- Node.js 18+ si se ejecuta sin contenedores.
- Python 3.10+ si se va a usar el simulador.

---

## 8. Ejecución con Docker Compose (recomendado)

Desde la raíz del proyecto:

```
docker-compose -f infra/docker-compose.yml up --build
```

Esto levanta:

- PostgreSQL
- RabbitMQ
- Backend
- Frontend

Una vez iniciado:

- Frontend: http://localhost:5173  
- Backend API: http://localhost:4000  
- RabbitMQ Panel: http://localhost:15672  

---

## 9. Ejecución del Backend sin Docker

```
cd backend
npm install
npm run dev
```

---

## 10. Ejecución del Frontend sin Docker

```
cd frontend
npm install
npm run dev
```

---

## 11. Pruebas Automáticas

```
cd backend
npm run test
```

Incluyen validación de autenticación, creación de salas e historial.

---

## 12. Simulador de Carga

Para ejecutar el simulador:

```
cd scripts
python simulate.py
```

El simulador genera:
- Métricas de latencia
- Estadísticas agregadas
- Archivo CSV de resultados

Las conclusiones están documentadas en `docs/`.

---

## 13. Documentación API REST

Ubicada en:
```
docs/04-apis-rest.md
```

Incluye:
- Endpoints
- Códigos de respuesta
- Ejemplos de peticiones
- Autenticación requerida

También se entrega colección de Postman en:
```
postman/chat-api.postman_collection.json
```

---

## 14. Documentación Técnica

En la carpeta `docs/` se incluye:

- Requerimientos funcionales y no funcionales
- Arquitectura general
- Diagrama de componentes
- Diagrama de secuencia
- Modelo de datos
- Diseño del API REST
- ADRs (decisiones de arquitectura)
- Resultados del simulador
- Métricas obtenidas
- Conclusiones del diseño

---

## 15. Conclusiones

El proyecto implementa de manera íntegra la arquitectura distribuida solicitada en el parcial final. Todas las funcionalidades, requisitos no funcionales, métricas y entregables especificados en el documento oficial fueron cumplidos. La solución final presenta un sistema robusto, modular, escalable y completamente funcional.

Este README resume los componentes esenciales para su despliegue, ejecución, pruebas y revisión académica.

