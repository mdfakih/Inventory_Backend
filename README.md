# Inventory Management System Backend API

A comprehensive Node.js backend API for inventory management, built with Express.js and MongoDB. This system manages inventory items (papers, stones, plastics, tapes), orders, designs, users, and provides reporting capabilities.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Inventory Management**: CRUD operations for papers, stones, plastics, and tapes
- **Order Management**: Create and manage orders with inventory tracking
- **Design Management**: Manage design templates and specifications
- **User Management**: Admin-only user management with role assignments
- **Reporting**: Generate various reports and analytics
- **File Upload**: Upload and manage files (images, documents)
- **Security**: Rate limiting, CORS, helmet security headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd inventory-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/inventory_management

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000` (or the port specified in your .env file).

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint                                   | Description                   | Auth Required |
| ------ | ------------------------------------------ | ----------------------------- | ------------- |
| POST   | `/login`                                   | User login                    | No            |
| POST   | `/logout`                                  | User logout                   | No            |
| GET    | `/me`                                      | Get current user              | Yes           |
| POST   | `/forgot-password`                         | Request password reset        | No            |
| GET    | `/password-reset-requests`                 | Get reset requests (Admin)    | Yes           |
| POST   | `/password-reset-requests/:userId/approve` | Approve reset request (Admin) | Yes           |

### Inventory Management (`/api/inventory`)

#### Papers

| Method | Endpoint                    | Description          | Auth Required |
| ------ | --------------------------- | -------------------- | ------------- |
| GET    | `/paper?type=internal\|out` | Get papers by type   | No            |
| POST   | `/paper`                    | Create new paper     | Yes           |
| PUT    | `/paper/:id`                | Update paper (Admin) | Yes           |
| DELETE | `/paper/:id`                | Delete paper (Admin) | Yes           |

#### Stones

| Method | Endpoint      | Description          | Auth Required |
| ------ | ------------- | -------------------- | ------------- |
| GET    | `/stones`     | Get all stones       | No            |
| POST   | `/stones`     | Create new stone     | Yes           |
| PUT    | `/stones/:id` | Update stone (Admin) | Yes           |
| DELETE | `/stones/:id` | Delete stone (Admin) | Yes           |

#### Plastics

| Method | Endpoint       | Description            | Auth Required |
| ------ | -------------- | ---------------------- | ------------- |
| GET    | `/plastic`     | Get all plastics       | No            |
| POST   | `/plastic`     | Create new plastic     | Yes           |
| PUT    | `/plastic/:id` | Update plastic (Admin) | Yes           |
| DELETE | `/plastic/:id` | Delete plastic (Admin) | Yes           |

#### Tapes

| Method | Endpoint    | Description         | Auth Required |
| ------ | ----------- | ------------------- | ------------- |
| GET    | `/tape`     | Get all tapes       | No            |
| POST   | `/tape`     | Create new tape     | Yes           |
| PUT    | `/tape/:id` | Update tape (Admin) | Yes           |
| DELETE | `/tape/:id` | Delete tape (Admin) | Yes           |

### Orders (`/api/orders`)

| Method | Endpoint                  | Description              | Auth Required |
| ------ | ------------------------- | ------------------------ | ------------- |
| GET    | `/`                       | Get all orders           | Yes           |
| POST   | `/`                       | Create new order         | Yes           |
| GET    | `/:id`                    | Get order by ID          | Yes           |
| PUT    | `/:id`                    | Update order             | Yes           |
| POST   | `/:id/recalculate-weight` | Recalculate order weight | Yes           |
| DELETE | `/:id`                    | Delete order (Admin)     | Yes           |

### Designs (`/api/designs`)

| Method | Endpoint | Description           | Auth Required |
| ------ | -------- | --------------------- | ------------- |
| GET    | `/`      | Get all designs       | No            |
| POST   | `/`      | Create new design     | Yes           |
| GET    | `/:id`   | Get design by ID      | No            |
| PUT    | `/:id`   | Update design         | Yes           |
| DELETE | `/:id`   | Delete design (Admin) | Yes           |

### User Management (`/api/masters/users`)

| Method | Endpoint               | Description                  | Auth Required |
| ------ | ---------------------- | ---------------------------- | ------------- |
| GET    | `/`                    | Get all users (Admin)        | Yes           |
| POST   | `/`                    | Create new user (Admin)      | Yes           |
| GET    | `/:id`                 | Get user by ID (Admin)       | Yes           |
| PUT    | `/:id`                 | Update user (Admin)          | Yes           |
| DELETE | `/:id`                 | Delete user (Admin)          | Yes           |
| POST   | `/:id/change-password` | Change user password (Admin) | Yes           |

### Reports (`/api/reports`)

| Method   | Endpoint       | Description              | Auth Required |
| -------- | -------------- | ------------------------ | ------------- |
| GET/POST | `/generate`    | Generate reports (Admin) | Yes           |
| POST     | `/export`      | Export reports (Admin)   | Yes           |
| GET      | `/low-stock`   | Get low stock alerts     | Yes           |
| GET      | `/order-stats` | Get order statistics     | Yes           |

### File Upload (`/api/upload`)

| Method | Endpoint     | Description           | Auth Required |
| ------ | ------------ | --------------------- | ------------- |
| POST   | `/`          | Upload single file    | Yes           |
| POST   | `/multiple`  | Upload multiple files | Yes           |
| GET    | `/`          | Get uploaded files    | Yes           |
| DELETE | `/:filename` | Delete uploaded file  | Yes           |

## Data Models

### User

- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: String (enum: 'admin', 'manager', 'employee')
- `status`: String (enum: 'active', 'blocked')
- `passwordResetRequest`: Object

### Paper

- `name`: String (required)
- `width`: Number (required)
- `quantity`: Number (required)
- `piecesPerRoll`: Number (required)
- `weightPerPiece`: Number (required)
- `inventoryType`: String (enum: 'internal', 'out')
- `updatedBy`: ObjectId (ref: User)

### Stone

- `name`: String (required, unique)
- `quantity`: Number (required)
- `unit`: String (enum: 'pieces', 'kg', 'grams')
- `weightPerPiece`: Number (required, positive)
- `description`: String
- `updatedBy`: ObjectId (ref: User)

### Plastic

- `name`: String (required, unique)
- `quantity`: Number (required)
- `unit`: String (enum: 'pieces', 'kg', 'grams', 'meters')
- `description`: String
- `updatedBy`: ObjectId (ref: User)

### Tape

- `name`: String (required, unique)
- `quantity`: Number (required)
- `unit`: String (enum: 'pieces', 'meters', 'rolls')
- `description`: String
- `updatedBy`: ObjectId (ref: User)

### Design

- `name`: String (required)
- `number`: String (required, unique)
- `description`: String
- `imageUrl`: String
- `status`: String (enum: 'active', 'inactive')
- `createdBy`: ObjectId (ref: User)

### Order

- `orderNumber`: String (auto-generated, unique)
- `designId`: ObjectId (ref: Design, required)
- `type`: String (enum: 'internal', 'out', required)
- `status`: String (enum: 'pending', 'in_progress', 'completed', 'cancelled')
- `quantity`: Number (required)
- `stonesUsed`: Array of stone usage objects
- `paperUsed`: Array of paper usage objects
- `receivedMaterials`: Object with stones and papers arrays
- `calculatedWeight`: Number (auto-calculated)
- `finalWeight`: Number (optional, for discrepancy calculation)
- `weightDiscrepancy`: Number (calculated: finalWeight - calculatedWeight)
- `notes`: String
- `createdBy`: ObjectId (ref: User)
- `updatedBy`: ObjectId (ref: User)

## Weight Calculation

The system automatically calculates order weights using the following formula:

**Calculated Weight = (Paper Weight per Piece + Stone Weight per Design) × Number of Pieces**

Where:

- **Paper Weight per Piece**: Sum of all paper weights used in the order
- **Stone Weight per Design**: Sum of all stone weights used in the order
- **Number of Pieces**: The quantity specified in the order

The system also tracks:

- **Final Weight**: The actual measured weight entered by users
- **Weight Discrepancy**: Difference between final weight and calculated weight (Final - Calculated)

### Weight Calculation Endpoints

- **POST `/api/orders/:id/recalculate-weight`**: Recalculates the weight for an existing order
- **PUT `/api/orders/:id`**: Update order with final weight to calculate discrepancy

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Or use cookies (automatically handled by the server).

## Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Manager**: Can create/update orders, view inventory, limited user management
- **Employee**: Can view inventory, create orders, limited access

## Error Handling

All API responses follow a consistent format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {} // Optional data payload
}
```

Error responses include appropriate HTTP status codes and descriptive messages.

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: File type and size restrictions

## Development

### Running in Development Mode

```bash
npm run dev
```

### Database Migration Scripts

After updating the codebase, you may need to run migration scripts to update existing data:

1. **Migrate Stone Weights** (adds weightPerPiece to existing stones):

   ```bash
   npm run migrate-stone-weights
   ```

2. **Recalculate Order Weights** (recalculates weights for existing orders):
   ```bash
   npm run recalculate-weights
   ```

### Running Tests

```bash
npm test
```

### Environment Variables

| Variable         | Description                | Default       |
| ---------------- | -------------------------- | ------------- |
| `MONGODB_URI`    | MongoDB connection string  | Required      |
| `JWT_SECRET`     | Secret key for JWT signing | Required      |
| `JWT_EXPIRES_IN` | JWT token expiration       | 7d            |
| `PORT`           | Server port                | 3000          |
| `NODE_ENV`       | Environment mode           | development   |
| `UPLOAD_PATH`    | File upload directory      | ./uploads     |
| `MAX_FILE_SIZE`  | Maximum file size in bytes | 5242880 (5MB) |

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure a production MongoDB instance
3. Set a strong `JWT_SECRET`
4. Configure proper CORS settings for your domain
5. Set up proper file upload storage (consider cloud storage for production)
6. Use a process manager like PM2 for production deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.
