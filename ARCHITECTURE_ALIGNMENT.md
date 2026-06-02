# PawNest architecture alignment

This version keeps the existing React + Express + MySQL stack, but restructures the backend to better match the submitted component diagram and deployment diagram.

## Mapping to the component diagram

| Diagram component | Code location |
|---|---|
| API Gateway Layer | `backend/src/server.js` and `backend/src/routes/*.js` |
| AccountService | `backend/src/services/accountService.js` |
| Booking Service | `backend/src/services/bookingService.js` |
| BookingOrchestrator | `completeBookingPaymentService()` in `bookingService.js` |
| ConflictChecker / ResourceScheduler | booking availability and time-block APIs in booking/admin routes/controllers |
| Information Service | `backend/src/services/informationService.js` |
| Review Manager | `reviewsController.js` and admin review functions |
| NotifyService | `backend/src/services/notificationService.js` |
| Image Storage Service | `backend/src/services/imageStorageService.js` adapter |
| DataRepository | `backend/src/repositories/*.js` |
| DB | MySQL configured in `backend/src/config/db.js` |

## What changed

- Added `backend/src/services/`:
  - `accountService.js`
  - `bookingService.js`
  - `membershipService.js`
  - `informationService.js`
  - `notificationService.js`
  - `imageStorageService.js`
- Added `backend/src/repositories/`:
  - `dataRepository.js`
  - `accountRepository.js`
  - `bookingRepository.js`
  - `informationRepository.js`
- Refactored controllers so they delegate business logic to service modules:
  - `authController.js` calls `accountService`
  - `publicController.js` calls `informationService`
  - `adminController.js` calls `bookingService` for service completion/payment

## Runtime note

This is still a modular monolith: it runs as one Express API Server, but the internal modules now map to the submitted UML components. The deployment diagram's Nginx, load balancer, external email and storage services are represented as adapter/service boundaries, so they can be replaced by real infrastructure later.
