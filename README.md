# FullService – Proyecto Web Full Stack

FullService es un sistema web orientado a la gestión de servicios de atención y turnos para una mutual. 
El proyecto incluye frontend en HTML/CSS/JS puro y backend en Node.js con Express, preparado para conectarse con una base de datos y permitir funcionalidades como registro,
login, envío de formularios y gestión administrativa.

---

## 📁 Estructura del proyecto

```
fullservice-proyecto-organizado/
├── fullservice-front/           # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── login.html
│   ├── registro.html
│   ├── admin.html
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   └── ...
├── fullservice-backend/        # Backend (Node.js + Express)
│   ├── index.js
│   ├── db.js
│   ├── package.json
│   └── routes/ (si aplica)
```

---

## 🚀 Cómo ejecutar el proyecto

### 1. Clonar el repositorio (si aplica)
```bash
git clone https://github.com/keeynnyth/fullservice-pp3.git
```

### 2. Ejecutar el backend
```bash
cd fullservice-backend
npm install
node index.js
```
El backend se ejecuta en `http://localhost:3000`

### 3. Probar el frontend
Abrir `index.html` directamente en el navegador desde `fullservice-front/`  
O usar un servidor local como Live Server en VSCode.

---

## 🔧 Tecnologías utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL (configurado en `db.js`)
- **Herramientas**: Visual Studio Code, Trello, Git

---

## 👥 Equipo de desarrollo

- Armando – Líder del proyecto / Frontend / Analista funcional
- Marcos – Backend Developer
- Fabián – Scrum Master
- Damián – QA Funcional
- Sofía – UX Content Designer

---

## 📌 Estado actual del proyecto

- [x] Formulario de contacto funcional
- [x] Backend corriendo en local
- [x] Estructura HTML y navegación básica
- [ ] Gestión de turnos
- [ ] Registro/Login funcional con base de datos
- [ ] Panel de usuario y administrador
