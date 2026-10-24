# 📂 Documentación del Modelo Documental - Gestor Documental

Este documento detalla la estructura de la base de datos NoSQL (MongoDB) utilizada en el sistema, justificando el uso de referencias, documentos embebidos y la estrategia de indexación para optimizar el rendimiento.

---

## 1. Colección: `usuarios`
Almacena la identidad de los usuarios, sus credenciales de acceso y el control de cuotas de almacenamiento.

### Campos principales:
*   `_id`: ObjectId (Clave primaria generada por MongoDB).
*   `nombres`, `apellidos`: String.
*   `correo`: String (Único).
*   `contrasena`: String (Hasheada con bcrypt).
*   `rol`: String (`administrador` | `usuario`).
*   `espacioAsignado`: Number (Bytes asignados, por defecto 1GB).
*   `espacioUtilizado`: Number (Bytes consumidos actualmente).
*   `estado`: String (`activo` | `inactivo`).
*   `createdAt`, `updatedAt`: Date (Generados por el `timestamps: true`).

### Justificación de diseño (Referencia): 
Es una colección independiente porque los usuarios son entidades raíz. Si se embebieran en cada archivo o carpeta, se duplicaría información y actualizar un perfil (ej. cambiar nombre) requeriría modificar miles de documentos.

### Índices propuestos:
*   `{ correo: 1 }` (**Único**): Para acelerar el login y evitar duplicados.

---

## 2. Colección: `carpetas`
Gestiona la jerarquía del sistema de archivos (directorios).

### Campos principales:
*   `_id`: ObjectId.
*   `nombre`: String.
*   `propietario_id`: ObjectId (Referencia a `usuarios`).
*   `carpeta_padre_id`: ObjectId (Referencia a `carpetas`, nulo si es raíz).
*   `estado`: String (`activo` | `papelera`).
*   `accesos`: Array de documentos embebidos (`acceso_schema`).
*   `comentarios`: Array de documentos embebidos (`usuario_id`, `texto`, `fecha`).

### Justificación de diseño (Referencia al Padre + Embebido):
*   Se usa **Referencia al Padre** (`carpeta_padre_id`) para evitar ciclos y permitir mover una carpeta completa con todos sus hijos con una sola actualización.
*   **Embebido** (`accesos` y `comentarios`): Los permisos y comentarios se leen siempre junto con la carpeta. Al estar embebidos, se evita hacer múltiples consultas (joins) para renderizar la vista. Tienen un límite controlado (no crecen infinitamente).

### Índices propuestos:
*   `{ propietario_id: 1, carpeta_padre_id: 1, estado: 1 }`: Para consultar rápidamente el contenido de una carpeta específica (vista "Mi Unidad").
*   `{ "accesos.usuario_id": 1 }`: Para listar rápidamente las carpetas compartidas con un usuario.

---

## 3. Colección: `archivos` (Metadatos)
Contiene la información lógica y los permisos de los archivos, mientras que el contenido físico se delega a GridFS.

### Campos principales:
*   `_id`: ObjectId.
*   `nombre`: String.
*   `tipo_archivo`: String (MIME Type, ej: `text/plain`).
*   `tamano`: Number (Bytes).
*   `propietario_id`: ObjectId (Referencia a `usuarios`).
*   `carpeta_id`: ObjectId (Referencia a `carpetas`).
*   `gridfs_id`: ObjectId (Referencia a `fs.files`).
*   `estado`: String (`activo` | `papelera`).
*   `accesos`: Array de documentos embebidos (permisos específicos del archivo).
*   `comentarios`: Array de documentos embebidos.

### Justificación de diseño: 
Al igual que las carpetas, usa referencias para el dueño y la ubicación. Los permisos son embebidos para lectura rápida en la UI.

### Índices propuestos:
*   `{ carpeta_id: 1, estado: 1 }`: Para cargar los archivos de una carpeta rápidamente.
*   `{ "accesos.usuario_id": 1 }`: Para la vista "Compartidos Conmigo".

---

## 4. Colección: `fs.files` y `fs.chunks` (GridFS)
MongoDB utiliza dos colecciones internas para el almacenamiento de archivos que superan los 16MB o cuando se desea manejar el contenido como streams.

*   `fs.files`: Metadatos del archivo binario (`id`, `filename`, `length`, `uploadDate`).
*   `fs.chunks`: Fragmentos del archivo binario (`files_id`, `n`, `data`).

### Justificación de diseño: 
GridFS fragmenta el archivo en pedazos de 255KB. Esto permite guardar archivos pesados sin saturar la memoria RAM del servidor y permite hacer streaming (descargas parciales). El documento en la colección `archivos` guarda el `gridfs_id` que apunta al `_id` del registro en `fs.files`.

---

## 5. Colección: `historialactividads`
Registra la bitácora de auditoría y las operaciones del sistema para los reportes.

### Campos principales:
*   `_id`: ObjectId.
*   `usuario_id`: ObjectId (Referencia a `usuarios`).
*   `recurso_id`: ObjectId (Puede ser un ID de archivo o de carpeta).
*   `tipo_recurso`: String (`archivo` | `carpeta`).
*   `accion`: String (`creacion`, `lectura`, `edicion`, `eliminacion`, `compartir`, `descarga`, `comentar`, etc.).
*   `detalles`: String (Opcional, para describir la acción).
*   `createdAt`: Date (Fecha del evento).

### Justificación de diseño (Referencia independiente): 
Debe ser una colección separada. Si el historial se embebiera dentro del documento del archivo o usuario, estos crecerían infinitamente, superando el límite de 16MB de MongoDB y degradando el rendimiento de las consultas normales (efecto *"unbounded array"*).

### Índices propuestos:
*   `{ createdAt: -1 }`: Para consultar la bitácora más reciente.
*   `{ usuario_id: 1, createdAt: -1 }`: Para filtrar la actividad de un usuario específico en un rango de fechas (Reportes de Actividad).
*   `{ recurso_id: 1 }`: Para ver el historial de un archivo en particular.

---

## 📊 Resumen de Patrones de Diseño Utilizados

| Patrón | Colecciones | Razón |
| :--- | :--- | :--- |
| **Referencia (Foreign Key)** | `usuarios`, `carpetas`, `archivos`, `historial` | Evita duplicidad de datos. Permite actualizaciones atómicas en entidades independientes. |
| **Referencia al Padre** | `carpetas` | Modela la jerarquía de árbol sin anidar documentos infinitamente. |
| **Documentos Embebidos** | `accesos`, `comentarios` (en carpetas y archivos) | Son datos dependientes del recurso. Se leen juntos, optimizando las consultas en la UI (una sola query trae el archivo y sus permisos). |
| **Bucket Pattern (GridFS)** | `fs.files`, `fs.chunks` | Almacenamiento de contenido binario eficiente sin límite de 16MB y con soporte para streaming. |
| **Polymorphic Reference** | `historialactividads` (`recurso_id`) | Un solo campo puede apuntar a un archivo o a una carpeta, diferenciados por el campo `tipo_recurso`. |

---

