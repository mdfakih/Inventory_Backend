# Inventory Management System API Documentation

## Base URL

```
http://localhost:3002/api
```

## Authentication

All API endpoints (except login) require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The token is automatically set as an HTTP-only cookie upon successful login.

## Response Format

All API responses follow this standard format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": { /* response data */ }
}
```

## Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 1. Authentication APIs

### 1.1 Login

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "admin|manager|employee",
    "name": "User Name"
  }
}
```

### 1.2 Logout

**POST** `/auth/logout`

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 1.3 Get Current User

**GET** `/auth/me`

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "admin|manager|employee",
    "name": "User Name"
  }
}
```

### 1.4 Forgot Password

**POST** `/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset request submitted successfully"
}
```

### 1.5 Get Password Reset Requests (Admin Only)

**GET** `/auth/password-reset-requests`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "passwordResetRequest": {
        "requested": true,
        "requestedAt": "2024-01-01T00:00:00.000Z",
        "approved": false
      }
    }
  ]
}
```

### 1.6 Approve Password Reset Request (Admin Only)

**POST** `/auth/password-reset-requests/:userId/approve`

**Request Body:**

```json
{
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset approved successfully"
}
```

---

## 2. Inventory Management APIs

### 2.1 Paper Management

#### Get Papers

**GET** `/inventory/paper?type=internal|out`

**Query Parameters:**

- `type` (optional): "internal" or "out" (default: "internal")

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "paper_id",
      "name": "Paper Name",
      "width": 100,
      "quantity": 50,
      "piecesPerRoll": 100,
      "weightPerPiece": 0.5,
      "inventoryType": "internal",
      "updatedBy": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Paper

**POST** `/inventory/paper`

**Request Body:**

```json
{
  "name": "Paper Name",
  "width": 100,
  "quantity": 50,
  "piecesPerRoll": 100,
  "weightPerPiece": 0.5,
  "inventoryType": "internal"
}
```

#### Update Paper (Admin Only)

**PUT** `/inventory/paper/:id`

**Request Body:**

```json
{
  "name": "Updated Paper Name",
  "width": 120,
  "piecesPerRoll": 120,
  "weightPerPiece": 0.6
}
```

#### Delete Paper (Admin Only)

**DELETE** `/inventory/paper/:id`

### 2.2 Stone Management

#### Get Stones

**GET** `/inventory/stones`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "stone_id",
      "name": "Stone Name",
      "quantity": 100,
      "unit": "pieces",
      "weightPerPiece": 2.5,
      "description": "Stone description",
      "updatedBy": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Create Stone

**POST** `/inventory/stones`

**Request Body:**

```json
{
  "name": "Stone Name",
  "quantity": 100,
  "unit": "pieces",
  "weightPerPiece": 2.5,
  "description": "Stone description"
}
```

#### Update Stone (Admin Only)

**PUT** `/inventory/stones/:id`

**Request Body:**

```json
{
  "name": "Updated Stone Name",
  "unit": "pieces",
  "weightPerPiece": 3.0,
  "description": "Updated description"
}
```

#### Delete Stone (Admin Only)

**DELETE** `/inventory/stones/:id`

### 2.3 Plastic Management

#### Get Plastics

**GET** `/inventory/plastic`

#### Create Plastic

**POST** `/inventory/plastic`

**Request Body:**

```json
{
  "name": "Plastic Name",
  "quantity": 200,
  "unit": "pieces",
  "description": "Plastic description"
}
```

#### Update Plastic (Admin Only)

**PUT** `/inventory/plastic/:id`

#### Delete Plastic (Admin Only)

**DELETE** `/inventory/plastic/:id`

### 2.4 Tape Management

#### Get Tapes

**GET** `/inventory/tape`

#### Create Tape

**POST** `/inventory/tape`

**Request Body:**

```json
{
  "name": "Tape Name",
  "quantity": 150,
  "unit": "pieces",
  "description": "Tape description"
}
```

#### Update Tape (Admin Only)

**PUT** `/inventory/tape/:id`

#### Delete Tape (Admin Only)

**DELETE** `/inventory/tape/:id`

---

## 3. Order Management APIs

### 3.1 Get All Orders

**GET** `/orders?status=pending&type=internal&designId=design_id`

**Query Parameters:**

- `status` (optional): "pending", "in_progress", "completed", "cancelled"
- `type` (optional): "internal", "out"
- `designId` (optional): Design ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "designId": {
        "_id": "design_id",
        "name": "Design Name",
        "number": "D001"
      },
      "type": "internal",
      "quantity": 100,
      "status": "pending",
      "stonesUsed": [
        {
          "stoneId": {
            "_id": "stone_id",
            "name": "Stone Name"
          },
          "quantity": 50
        }
      ],
      "paperUsed": [
        {
          "paperId": {
            "_id": "paper_id",
            "name": "Paper Name"
          },
          "quantity": 200
        }
      ],
      "notes": "Order notes",
      "calculatedWeight": 150.5,
      "finalWeight": 155.0,
      "weightDiscrepancy": 4.5,
      "createdBy": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3.2 Create Order

**POST** `/orders`

**Request Body:**

```json
{
  "designId": "design_id",
  "type": "internal",
  "quantity": 100,
  "stonesUsed": [
    {
      "stoneId": "stone_id",
      "quantity": 50
    }
  ],
  "paperUsed": [
    {
      "paperId": "paper_id",
      "quantity": 200
    }
  ],
  "notes": "Order notes"
}
```

### 3.3 Get Order by ID

**GET** `/orders/:id`

### 3.4 Update Order

**PUT** `/orders/:id`

**Request Body:**

```json
{
  "status": "completed",
  "notes": "Updated notes",
  "finalWeight": 155.0
}
```

### 3.5 Recalculate Order Weight

**POST** `/orders/:id/recalculate-weight`

**Response:**

```json
{
  "success": true,
  "message": "Weight recalculated successfully",
  "data": {
    "order": {
      /* order data */
    },
    "weightCalculation": {
      "calculatedWeight": 150.5,
      "breakdown": {
        "stonesWeight": 125.0,
        "paperWeight": 25.5
      }
    }
  }
}
```

### 3.6 Delete Order (Admin Only)

**DELETE** `/orders/:id`

---

## 4. Design Management APIs

### 4.1 Get All Designs

**GET** `/designs?status=active`

**Query Parameters:**

- `status` (optional): "active", "inactive"

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "design_id",
      "name": "Design Name",
      "number": "D001",
      "description": "Design description",
      "imageUrl": "/uploads/design-image.jpg",
      "status": "active",
      "createdBy": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4.2 Create Design

**POST** `/designs`

**Request Body:**

```json
{
  "name": "Design Name",
  "number": "D001",
  "description": "Design description",
  "imageUrl": "/uploads/design-image.jpg"
}
```

### 4.3 Get Design by ID

**GET** `/designs/:id`

### 4.4 Update Design

**PUT** `/designs/:id`

**Request Body:**

```json
{
  "name": "Updated Design Name",
  "number": "D002",
  "description": "Updated description",
  "imageUrl": "/uploads/new-image.jpg",
  "status": "inactive"
}
```

### 4.5 Delete Design (Admin Only)

**DELETE** `/designs/:id`

---

## 5. User Management APIs (Admin Only)

### 5.1 Get All Users

**GET** `/masters/users`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "admin",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5.2 Create User

**POST** `/masters/users`

**Request Body:**

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "employee"
}
```

### 5.3 Get User by ID

**GET** `/masters/users/:id`

### 5.4 Update User

**PUT** `/masters/users/:id`

**Request Body:**

```json
{
  "name": "Updated User Name",
  "email": "updated@example.com",
  "role": "manager",
  "status": "active"
}
```

### 5.5 Delete User

**DELETE** `/masters/users/:id`

### 5.6 Change User Password

**POST** `/masters/users/:id/change-password`

**Request Body:**

```json
{
  "newPassword": "newpassword123"
}
```

---

## 6. Reports APIs

### 6.1 Generate Reports

**GET** `/reports/generate?type=analytics&startDate=2024-01-01&endDate=2024-12-31`

**POST** `/reports/generate`

**Query/Request Parameters:**

- `type`: "all", "inventory", "orders", "users", "analytics"
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering

**Response (Analytics Example):**

```json
{
  "success": true,
  "data": {
    "orders": [
      /* order data */
    ],
    "stones": [
      /* stone data */
    ],
    "papers": [
      /* paper data */
    ],
    "analytics": {
      "inventory": {
        "totalStoneQuantity": 1500,
        "totalPaperQuantity": 500,
        "lowStockStones": 5,
        "lowStockPapers": 3
      },
      "orders": {
        "total": 100,
        "completed": 80,
        "pending": 15,
        "internal": 60,
        "out": 40
      },
      "lowStockItems": [
        /* low stock items */
      ]
    }
  }
}
```

### 6.2 Export Reports

**POST** `/reports/export`

**Request Body:**

```json
{
  "type": "analytics",
  "format": "csv",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

### 6.3 Get Low Stock Alerts

**GET** `/reports/low-stock`

**Response:**

```json
{
  "success": true,
  "data": {
    "lowStockItems": [
      {
        "_id": "item_id",
        "name": "Item Name",
        "quantity": 50,
        "type": "stone"
      }
    ],
    "summary": {
      "stones": 5,
      "papers": 3,
      "plastics": 2,
      "tapes": 1,
      "total": 11
    }
  }
}
```

### 6.4 Get Order Statistics

**GET** `/reports/order-stats?startDate=2024-01-01&endDate=2024-12-31`

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "byStatus": {
      "pending": 15,
      "in_progress": 5,
      "completed": 80,
      "cancelled": 0
    },
    "byType": {
      "internal": 60,
      "out": 40
    },
    "totalQuantity": 5000
  }
}
```

---

## 7. File Upload APIs

### 7.1 Upload Single File

**POST** `/upload`

**Request:** Multipart form data with field name "file"

**Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "originalName": "image.jpg",
    "filename": "image-1234567890.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "path": "./uploads/image-1234567890.jpg",
    "url": "/uploads/image-1234567890.jpg",
    "uploadedBy": "user_id",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7.2 Upload Multiple Files

**POST** `/upload/multiple`

**Request:** Multipart form data with field name "files"

**Response:**

```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "data": [
    {
      "originalName": "file1.jpg",
      "filename": "file1-1234567890.jpg",
      "mimetype": "image/jpeg",
      "size": 1024000,
      "path": "./uploads/file1-1234567890.jpg",
      "url": "/uploads/file1-1234567890.jpg",
      "uploadedBy": "user_id",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 7.3 Get Uploaded Files

**GET** `/upload`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "filename": "image-1234567890.jpg",
      "size": 1024000,
      "url": "/uploads/image-1234567890.jpg",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 7.4 Delete Uploaded File

**DELETE** `/upload/:filename`

---

## 8. Health Check

### 8.1 Server Health

**GET** `/health`

**Response:**

```json
{
  "status": "OK",
  "message": "Inventory Management API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 9. Frontend Integration Examples

### 9.1 JavaScript/TypeScript Examples

#### Login Function

```javascript
async function login(email, password) {
  try {
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store user info in localStorage or state
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

#### Authenticated API Call

```javascript
async function fetchOrders() {
  try {
    const response = await fetch('http://localhost:3002/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Fetch orders error:', error);
    throw error;
  }
}
```

#### Create Order

```javascript
async function createOrder(orderData) {
  try {
    const response = await fetch('http://localhost:3002/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
}
```

#### File Upload

```javascript
async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:3002/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

### 9.2 React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api${endpoint}`, {
        credentials: 'include',
        ...options,
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}
```

### 9.3 Error Handling

```javascript
function handleApiError(error) {
  if (error.message.includes('Unauthorized')) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.message.includes('Forbidden')) {
    // Show access denied message
    alert('You do not have permission to perform this action');
  } else {
    // Show generic error
    alert('An error occurred: ' + error.message);
  }
}
```

---

## 10. Environment Variables

Create a `.env` file in your backend root directory:

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/inventory_db
JWT_SECRET=your-secret-key-here
NODE_ENV=development
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

---

## 11. CORS Configuration

The API is configured to allow CORS from any origin in development mode. For production, update the CORS configuration in `server.js`:

```javascript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : true,
    credentials: true,
  }),
);
```

---

## 12. Rate Limiting

The API implements rate limiting:

- 100 requests per 15 minutes per IP address
- Configured in `server.js`

---

## 13. Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcrypt
- Input validation and sanitization
- Helmet.js for security headers
- Rate limiting to prevent abuse
- File upload restrictions (file type and size)

---

## 14. Database Models

### User Roles

- `admin`: Full access to all features
- `manager`: Can manage inventory and orders
- `employee`: Can view inventory and create orders

### Order Statuses

- `pending`: Order created, waiting to start
- `in_progress`: Order is being processed
- `completed`: Order finished
- `cancelled`: Order cancelled

### Inventory Types

- `internal`: Internal inventory
- `out`: External inventory

---

This documentation covers all the APIs available in your Inventory Management System. Use these endpoints to build your frontend application with proper authentication and error handling.
