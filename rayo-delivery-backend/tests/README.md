# 📋 Guía de Testing - Rayo Delivery Backend

## 🎯 RIESGO 1: Registro Incorrecto de Pedidos

### Descripción del Test
Este test unitario valida que el sistema registre pedidos correctamente evitando datos incorrectos o inconsistentes que puedan causar:
- Pedidos sin productos
- Cálculos incorrectos de subtotal/total
- Direcciones inválidas
- Métodos de pago no soportados
- Pedidos fuera de horario de atención

### Archivo de Test
📄 `tests/pedidoController.test.js` (26 tests)

---

## 🎯 RIESGO 2: Asignación Incorrecta de Repartidores

### Descripción del Test
Este test unitario valida que el sistema asigne motorizados correctamente a los pedidos basándose en:
- Disponibilidad del motorizado
- Estado de cuenta activo
- Balanceo de carga de trabajo
- Exclusión de pedidos ya entregados/cancelados
- Actualización correcta del estado del pedido

### Archivo de Test
📄 `tests/assignmentService.test.js` (23 tests)

---

## 🎯 RIESGO 3: Falta de Seguimiento del Estado del Pedido

### Descripción del Test
Este test unitario valida que el sistema mantenga un seguimiento correcto de los estados con:
- Actualización de estados con validación de permisos
- Registro completo en historial de estados (RF-14)
- Generación de código de entrega (RF-15)
- Validación y confirmación de entrega con código
- Emisión de eventos en tiempo real (Socket.IO)
- Transiciones de estado válidas

### Archivo de Test
📄 `tests/estadoPedido.test.js` (28 tests)

---

## 🎯 RIESGO 4: Errores en el Acceso al Sistema (Autenticación)

### Descripción del Test
Este test unitario valida que el sistema gestione correctamente la autenticación y autorización:
- Registro de usuarios con validaciones (RF-01)
- Login con credenciales válidas/inválidas (RF-02)
- Generación y validación de tokens JWT
- Refresh tokens para renovar sesiones
- Recuperación de contraseña con códigos (RF-03)
- Middleware de autenticación
- Seguridad de contraseñas (encriptación)

### Archivo de Test
📄 `tests/authController.test.js` (31 tests)

---

## 🎯 RIESGO 5: Inconsistencia de Datos en la Base de Datos

### Descripción del Test
Este test unitario valida la integridad y consistencia de datos en la base de datos:
- Atomicidad de transacciones (commit/rollback)
- Integridad referencial (foreign keys)
- Validación de datos (constraints)
- Manejo de concurrencia (race conditions)
- Registro de historial de cambios
- Relaciones opcionales y nulas

### Archivo de Test
📄 `tests/dataIntegrity.test.js` (21 tests)

---

## 🚀 Instrucciones de Ejecución

### 1️⃣ Instalación de Dependencias

Primero, instala Jest y las herramientas necesarias:

```bash
cd rayo-delivery-backend
npm install --save-dev jest
```

### 2️⃣ Configurar package.json

Agrega el script de test en tu `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 3️⃣ Ejecutar los Tests

**Ejecutar todos los tests:**
```bash
npm test
```

**Ejecutar solo el test de pedidos:**
```bash
npm test pedidoController.test.js
```

**Ejecutar solo el test de asignación:**
```bash
npm test assignmentService.test.js
```

**Ejecutar solo el test de seguimiento de estados:**
```bash
npm test estadoPedido.test.js
```

**Ejecutar solo el test de autenticación:**
```bash
npm test authController.test.js
```

**Ejecutar solo el test de integridad de datos:**
```bash
npm test dataIntegrity.test.js
```

**Ejecutar en modo watch (auto-reload):**
```bash
npm run test:watch
```

**Ejecutar con reporte de cobertura:**
```bash
npm run test:coverage
```

---

## 📊 Escenarios Cubiertos

**Total de pruebas:** 129 tests distribuidos en 5 archivos de test

---

### ✅ RIESGO 5: Inconsistencia de Datos (21 tests)

**Transacciones (3 tests)**
- ✅ Commit exitoso en creación de pedido
- ✅ Rollback automático si falla inserción de detalles
- ✅ Rollback si falla beginTransaction

**Integridad Referencial (4 tests)**
- ✅ Validar FK: usuario_id existe
- ✅ Validar FK: motorizado_id existe
- ✅ Validar FK: producto_id existe
- ✅ Permitir motorizado_id NULL

**Validación de Datos (5 tests)**
- ✅ Prevenir subtotal negativo
- ✅ Prevenir cantidad negativa o cero
- ✅ Validar estados permitidos
- ✅ Validar dirección no vacía
- ✅ Validar tipos de datos

**Concurrencia (3 tests)**
- ✅ Asignación concurrente de motorizado
- ✅ Prevenir doble confirmación de entrega
- ✅ Actualización simultánea de carga_trabajo

**Historial de Estados (3 tests)**
- ✅ Registrar historial sin bloquear operación principal
- ✅ Registrar estado_anterior correctamente
- ✅ Observación con código de entrega

**Validación de Relaciones (5 tests)**
- ✅ Pedido con detalles vacíos
- ✅ Producto sin local asociado (FK null)
- ✅ Error en consulta de usuario
- ✅ Detalle sin producto_id
- ✅ Relaciones opcionales

---

### ✅ RIESGO 1: Registro de Pedidos (26 tests)

1. **Productos**
   - ❌ Pedido sin productos
   - ❌ Productos no es array
   - ❌ Producto sin cantidad numérica
   - ❌ Producto sin precio numérico

2. **Subtotal**
   - ❌ Subtotal no numérico
   - ✅ Subtotal numérico válido

3. **Dirección**
   - ❌ Dirección vacía
   - ❌ Dirección null
   - ❌ Dirección no string

4. **Método de Pago**
   - ✅ Efectivo (válido)
   - ✅ Yape (válido)
   - ✅ Plin (válido)
   - ❌ Otros métodos (inválido)
   - ❌ Métodos en minúsculas

5. **Tarifa de Envío (RF-19)**
   - ✅ Cálculo con coordenadas
   - ✅ Fallback a tarifa base
   - ✅ Uso de valor enviado

6. **Horarios de Local (RF-29)**
   - ❌ Pedido fuera de horario
   - ✅ Pedido dentro de horario
   - ✅ Sin local_id

7. **Asignación Automática (RF-10)**
   - ✅ Asignar motorizado disponible
   - ✅ Estado 'registrado' sin motorizado

8. **Autenticación**
   - ❌ Usuario no autenticado
   - ❌ Sin ID de usuario

9. **Manejo de Errores**
   - ✅ Error en base de datos
   - ✅ Error en búsqueda de motorizado

---

### ✅ RIESGO 2: Asignación de Repartidores (28 tests)

1. **Asignación Exitosa**
   - ✅ Asignar a motorizado con menor carga
   - ✅ Balanceo entre varios motorizados
   - ✅ Actualizar estado a "asignado"

2. **Sin Motorizados Disponibles**
   - ❌ Retornar null si no hay disponibles
   - ❌ No actualizar pedido sin motorizado

3. **Filtros de Disponibilidad**
   - ✅ Solo rol "motorizado"
   - ✅ Solo estado_cuenta "activo"
   - ✅ Solo disponible = 1
   - ✅ Excluir entregados/cancelados
   - ✅ Ordenar por carga ASC
   - ✅ Limitar a 1 resultado

4. **Balanceo de Carga**
   - ✅ Priorizar carga 0
   - ✅ Asignar con carga máxima si es único

5. **Manejo de Errores**
   - ❌ Error en consulta de motorizados
   - ❌ Error al actualizar pedido
   - ❌ Respuesta inesperada de BD

6. **Validación de Parámetros**
   - ✅ Usar pedidoId correcto
   - ✅ Retornar ID del motorizado

7. **Consistencia**
   - ✅ Motorizado asignado coincide
   - ✅ Tipo de retorno correcto

8. **Carga Real**
   - ✅ Motorizado sin pedidos previos
   - ✅ Conteo correcto de pedidos

9. **Casos Extremos**
   - ✅ Múltiples con misma carga
   - ✅ ID de pedido muy grande

---

### ✅ RIESGO 3: Seguimiento del Estado del Pedido (31 tests)

1. **Actualización de Estados**
   - ✅ Actualizar estado correctamente
   - ❌ Rechazar si pedido no existe
   - ❌ Rechazar si no es motorizado asignado
   - ✅ Permitir a admin actualizar cualquier pedido
   - ✅ Emitir evento Socket.IO

2. **Código de Entrega (RF-15)**
   - ✅ Generar código al ir a cliente
   - ✅ Retornar código en respuesta
   - ✅ Emitir código en evento

3. **Confirmación de Entrega**
   - ✅ Confirmar con código válido
   - ❌ Rechazar sin código
   - ❌ Rechazar si pedido no existe
   - ❌ Rechazar motorizado no asignado
   - ❌ Rechazar código incorrecto
   - ❌ Rechazar si ya está entregado
   - ✅ Emitir evento de confirmación
   - ✅ Permitir a admin confirmar

4. **Historial de Estados (RF-14)**
   - ✅ Obtener historial completo
   - ❌ Rechazar si pedido no existe
   - ❌ Rechazar sin permisos
   - ✅ Permitir a cliente ver su historial
   - ✅ Permitir a motorizado ver asignados
   - ✅ Permitir a admin ver cualquiera
   - ✅ Retornar array vacío si no hay cambios

5. **Manejo de Errores**
   - ❌ Error al actualizar estado
   - ❌ Error al obtener historial
   - ✅ Continuar sin Socket.I8.15 |    82.35 |   92.30 |   88.15 |
assignmentService.js    |   92.45 |    85.71 |  100.00 |   92.45 |
pedidoModel.js          |   75.80 |    68.42 |   85.71 |   75.80
6. **Transiciones Válidas**
   - ✅ Registrado → Asignado
   - ✅ Asignado → En camino al local
   - ✅ Cualquier estado → Cancelado

---

### ✅ RIESGO 4: Errores en el Acceso al Sistema (39 tests)

1. **Registro de Usuarios (RF-01)**
   - ✅ Registrar cliente con datos válidos
   - ❌ Rechazar sin datos obligatorios
   - ❌ Rechazar correo duplicado
   - ❌ Validar placa/licencia para motorizados
   - ✅ Registrar motorizado correctamente
   - ❌ Manejar errores del servidor

2. **Login (RF-02)**
   - ✅ Login con credenciales válidas
   - ❌ Rechazar sin correo o contraseña
   - ❌ Rechazar usuario no existente
   - ❌ Rechazar contraseña incorrecta
   - ✅ Generar refresh token
   - ❌ Manejar errores del servidor

3. **Recuperación de Contraseña (RF-03)**
   - ✅ Enviar código a correo válido
   - ✅ Responder genéricamente si no existe
   - ✅ Resetear con código válido
   - ❌ Rechazar código inválido/expirado
   - ❌ Rechazar sin código o contraseña

4. **Refresh Token**
   - ✅ Generar nuevo token con refresh válido
   - ❌ Rechazar refresh token inválido
   - ❌ Rechazar refresh token expirado
   - ❌ Rechazar sin refresh token

5. **Logout**
   - ✅ Cerrar sesión correctamente
   - ❌ Rechazar sin refresh token
   - ❌ Manejar errores

6. **Middleware de Autenticación**
   - ✅ Permitir con token válido
   - ❌ Rechazar sin token
   - ❌ Rechazar token inválido
   - ✅ Limpiar prefijo Bearer

7. **Seguridad**
   - ✅ Encriptar contraseñas
   - ✅ Incluir datos en JWT
   - ✅ No revelar info sensible

---

## 📈 Interpretación de Resultados

### Resultado Exitoso:
```
PASS  tests/pedidoController.test.js
  RIESGO 1: Registro Incorrecto de Pedidos
    ✓ debe rechazar pedido sin productos (5ms)
    ✓ debe rechazar subtotal no numérico (3ms)
    ✓ debe aceptar método "Efectivo" (4ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
```

### Resultado con Fallos:
```
FAIL  tests/pedidoController.test.js
  ● debe rechazar pedido sin productos
  
    expect(received).toHaveBeenCalledWith(expected)
    
    Expected: 400
    Received: 200
```

---

## 🎯 Cobertura de Código

Después de ejecutar `npm run test:coverage`, verás:

```
------------------------|---------|----------|---------|---------|
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
pedidoController.js     |   85.23 |    78.95 |   90.00 |   85.23 |
assignmentService.js    |   92.45 |    85.71 |  100.00 |   92.45 |
------------------------|---------|----------|---------|---------|
```

**Archivos prioritarios:**
- `controllers/pedidoController.js`
- `models/pedidoModel.js`
- `models/orderModel.js` (transacciones)
- `controllers/authController.js`
- `middlewares/auth.js`
- `services/assignmentService.js`

**Meta recomendada:** 
- ✅ Cobertura > 80% en controladores críticos
- ✅ Cobertura > 70% en servicios
- ✅ 100% en validaciones de negocio

---

## 🔄 Próximos Tests Recomendados

1. **RIESGO 6: Cálculo Incorrecto de Tarifas**
   - Test de `tarifaService.js`
   - Validación de distancias
   - Aplicación de recargos

4. **RIESGO 6: Actualización de Estados de Pedidos**
   - Test de transiciones válidas
   - Permisos por rol
   - Notificaciones

---

## 🛠️ Troubleshooting

### Error: "Cannot find module 'jest'"
```bash
npm install --save-dev jest
```

### Error: "SyntaxError: Unexpected token 'export'"
Añade en `jest.config.js`:
```javascript
transform: {
  '^.+\\.js$': 'babel-jest'
}
```

### Los mocks no funcionan
Verifica que los paths en `jest.mock()` sean correctos relativos a la ubicación del test.

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Node.js Apps](https://nodejs.org/en/docs/guides/testing/)
- [Mocking with Jest](https://jestjs.io/docs/mock-functions)

---

**Autor:** Equipo Rayo Delivery  
**Fecha:** 12 de enero de 2026  
**Versión:** 1.0
