# Recorrido completo del portafolio

Capturas reales del navegador, con datos sintéticos y SQLite temporal. Se generan desde `tests/e2e/staff-integration.spec.ts` con `CARWASH_CAPTURE_JOURNEY=1`. No utilizan la base de datos de la instalación local.

## Reproducir

```powershell
$env:CARWASH_CAPTURE_JOURNEY='1'
npx playwright test --config playwright.staff.config.ts --grep 'Admin creates'
```

El escenario verifica acceso por roles, catálogo y tarifas por vehículo, creación de empleado, publicación/edición/retiro de ofertas, registro de cliente, cotización y orden, llegada, asignación, finalización mock, notificación privada y entrega. También reinicia el servidor y comprueba persistencia, reautenticación y revocación del empleado. Las contraseñas aleatorias y la clave de instalación no se publican.

## Secuencia

### 01 · Administrator sign-in

The administrator enters through a separate staff portal. The client-facing 3D world is not used as the administration dashboard.

![01 · Administrator sign-in](a01-admin-login.png)

### 02 · Create an employee account

The administrator creates an operator account with the employee role. Server-side permissions limit the employee to operational actions.

![02 · Create an employee account](a02-employee-created.png)

### 03 · Publish prices and estimated times

A new ceramic-protection service is configured for four vehicle categories: Carro $44 / 27 min, Pickup $52 / 35 min, Truck $62 / 45 min, SUV $48 / 30 min. These are demonstration prices.

![03 · Publish prices and estimated times](a03-service-prices-duration.png)

### 04 · Publish a seasonal offer

The administrator publishes Cuidado de temporada. The same content is shown to the customer later in this sequence.

![04 · Publish a seasonal offer](a04-published-offer.png)

### 05 · Customer registration

A new customer registers from Mi cuenta in the spatial web app. Only synthetic test data is used in this walkthrough.

![05 · Customer registration](c01-customer-registration.png)

### 06 · Private customer account

Registration establishes a private customer account. Customer access is separate from employee and administrator permissions.

![06 · Private customer account](c02-customer-account.png)

### 07 · Choose a service for the vehicle

The customer selects the newly published ceramic-protection service for Carro. Its $44 base price comes from the administrator configuration.

![07 · Choose a service for the vehicle](c03-service-selected.png)

### 08 · Review vehicle details

The customer reviews the vehicle information before requesting a quotation. The walkthrough follows one demonstration order through the remaining stages.

![08 · Review vehicle details](c04-vehicle-details.png)

### 09 · Review the quotation

The customer reviews the selected service, estimated time and itemized quotation before confirming. The demonstration total is $49.06, including $5.06 tax.

![09 · Review the quotation](c05-quote-review.png)

### 10 · Confirm the order

The order is confirmed, but physical arrival and payment remain pending. Browsing the virtual site does not automatically check in a vehicle or charge the customer.

![10 · Confirm the order](c06-order-confirmed.png)

### 11 · Employee confirms arrival

An authenticated employee confirms the physical arrival. The order enters the operational queue and becomes visible in the customer waiting view.

![11 · Employee confirms arrival](e01-arrival-confirmed.png)

### 12 · Customer follows the queue

The customer consults the lounge terminal to see queue position and pending tasks for the same order. The state comes from the backend.

![12 · Customer follows the queue](c07-waiting-status.png)

### 13 · Employee assigns service

The employee assigns attention and sees ceramic protection in progress. Operations use a conventional staff dashboard connected to the customer experience.

![13 · Employee assigns service](e02-service-active.png)

### 14 · Customer tracks the assigned bay

Ver mi auto navigates to the assigned bay. The spatial view displays the service state and elapsed time reported by the operation.

![14 · Customer tracks the assigned bay](c08-track-vehicle.png)

### 15 · Service ready for handover

The employee simulates service completion and reviews the order before confirming handover. Completion is an explicit operational action.

![15 · Service ready for handover](e03-ready-for-handover.png)

### 16 · Customer receives completion notice

The customer receives a private in-app completion notification for the same order. This is a mock notification adapter; external email, SMS and messaging are not connected.

![16 · Customer receives completion notice](c09-private-completion-notice.png)

### 17 · Sign in again and recover the order

After handover, the customer signs out and signs in again. The private account restores the completed order from SQLite. Payment remains pending; this walkthrough does not simulate a successful payment.

![17 · Sign in again and recover the order](c10-order-history.png)

### 18 · Customer sees the published offer

The lounge displays the seasonal offer created by the administrator at the start of the walkthrough, demonstrating shared configured content.

![18 · Customer sees the published offer](c11-offer-visible-to-customer.png)

### 19 · Administrator reviews the order

The administrator reviews the order list after the service and handover flow. This closes the demonstration across customer, employee and administrator roles.

![19 · Administrator reviews the order](a05-orders-dashboard.png)

## Alcance

El pago permanece pendiente. La notificación usa el adaptador interno mock y no envía mensajes externos. Las capturas muestran el MVP local y no acreditan un despliegue de producción ni la ejecución de Docker. La captura de tarifas usa una ventana de navegador más alta para mostrar precios y tiempos completos; las imágenes no reemplazan ni redibujan la interfaz.
