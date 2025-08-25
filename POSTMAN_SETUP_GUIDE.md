# Postman Collection Setup Guide

## 📋 Overview

This guide will help you set up and use the Postman collection for testing the Inventory Management System API. The collection includes all endpoints with proper authentication, request bodies, and environment variables.

## 🚀 Quick Setup

### 1. Import Collection and Environment

1. **Import the Collection:**

   - Open Postman
   - Click "Import" button
   - Select `Inventory_Management_API.postman_collection.json`
   - The collection will be imported with all endpoints organized by category

2. **Import the Environment:**
   - Click "Import" button again
   - Select `Inventory_Management_Environment.postman_environment.json`
   - Select the environment from the dropdown in the top-right corner

### 2. Configure Environment Variables

Update the following variables in your environment:

| Variable   | Description         | Example Value               |
| ---------- | ------------------- | --------------------------- |
| `baseUrl`  | API base URL        | `http://localhost:3002/api` |
| `email`    | Your login email    | `admin@example.com`         |
| `password` | Your login password | `admin123`                  |

### 3. Start Testing

1. **First, test the server health:**

   - Run the "Server Health" request under "Health Check"
   - Should return status 200 with server information

2. **Login to get authentication token:**
   - Run the "Login" request under "Authentication"
   - This will automatically set the `authToken` variable
   - Check the console for login success message

## 📁 Collection Structure

### 1. Authentication

- **Login** - Authenticate and get JWT token
- **Logout** - Clear authentication
- **Get Current User** - Get logged-in user details
- **Forgot Password** - Request password reset
- **Password Reset Management** (Admin only)

### 2. Inventory Management

- **Paper Management** - CRUD operations for papers
- **Stone Management** - CRUD operations for stones
- **Plastic Management** - CRUD operations for plastics
- **Tape Management** - CRUD operations for tapes

### 3. Order Management

- **Get All Orders** - List orders with filters
- **Create Order** - Create new order
- **Get Order by ID** - Get specific order details
- **Update Order** - Update order status and details
- **Recalculate Weight** - Recalculate order weight
- **Delete Order** (Admin only)

### 4. Design Management

- **Get All Designs** - List designs with filters
- **Create Design** - Create new design
- **Get Design by ID** - Get specific design details
- **Update Design** - Update design information
- **Delete Design** (Admin only)

### 5. User Management (Admin Only)

- **Get All Users** - List all users
- **Create User** - Create new user account
- **Get User by ID** - Get specific user details
- **Update User** - Update user information
- **Delete User** - Remove user account
- **Change Password** - Reset user password

### 6. Reports

- **Generate Reports** - Get various report types
- **Export Reports** - Export reports in different formats
- **Low Stock Alerts** - Get items with low stock
- **Order Statistics** - Get order analytics

### 7. File Upload

- **Upload Single File** - Upload one file
- **Upload Multiple Files** - Upload multiple files
- **Get Uploaded Files** - List uploaded files
- **Delete Uploaded File** - Remove uploaded file

### 8. Health Check

- **Server Health** - Check API server status

## 🔐 Authentication Flow

### Automatic Token Management

The collection includes automatic token management:

1. **Login Request** automatically:

   - Extracts the JWT token from the response
   - Sets the `authToken` environment variable
   - Sets `userId` and `userRole` variables

2. **All authenticated requests** use:
   - `{{authToken}}` in the Cookie header
   - Automatic token inclusion

### Manual Token Setup (if needed)

If automatic token extraction doesn't work:

1. Run the Login request
2. Copy the token from the response
3. Set the `authToken` environment variable manually

## 🧪 Testing Workflow

### Recommended Testing Sequence

1. **Health Check**

   ```
   GET /health
   ```

2. **Authentication**

   ```
   POST /auth/login
   ```

3. **Create Test Data**

   ```
   POST /designs (Create a design)
   POST /inventory/paper (Create paper)
   POST /inventory/stones (Create stone)
   ```

4. **Create Order**

   ```
   POST /orders (Use the created design, paper, and stone IDs)
   ```

5. **Test Reports**

   ```
   GET /reports/low-stock
   GET /reports/order-stats
   ```

6. **Test File Upload**
   ```
   POST /upload (Upload a test image)
   ```

### Environment Variables Usage

The collection uses these variables that get set automatically:

| Variable    | Set By                | Used In                      |
| ----------- | --------------------- | ---------------------------- |
| `authToken` | Login request         | All authenticated requests   |
| `userId`    | Login request         | User management requests     |
| `userRole`  | Login request         | Role-based access control    |
| `paperId`   | Create paper request  | Update/delete paper requests |
| `stoneId`   | Create stone request  | Update/delete stone requests |
| `designId`  | Create design request | Order creation               |
| `orderId`   | Create order request  | Order management             |

## 📝 Request Examples

### Creating a Paper

```json
{
  "name": "Premium Paper A4",
  "width": 210,
  "quantity": 100,
  "piecesPerRoll": 500,
  "weightPerPiece": 0.8,
  "inventoryType": "internal"
}
```

### Creating an Order

```json
{
  "designId": "{{designId}}",
  "type": "internal",
  "quantity": 100,
  "stonesUsed": [
    {
      "stoneId": "{{stoneId}}",
      "quantity": 50
    }
  ],
  "paperUsed": [
    {
      "paperId": "{{paperId}}",
      "quantity": 200
    }
  ],
  "notes": "Sample order for testing"
}
```

### Generating Analytics Report

```json
{
  "type": "analytics",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Failed**

   - Check if the server is running
   - Verify email and password in environment variables
   - Ensure the `authToken` variable is set after login

2. **CORS Errors**

   - Make sure the backend CORS is configured properly
   - Check if the `baseUrl` is correct

3. **File Upload Issues**

   - Ensure the file size is under 5MB
   - Check if the file type is supported (images, documents)
   - Verify the uploads directory exists

4. **Database Connection Errors**
   - Check if MongoDB is running
   - Verify the database connection string
   - Ensure the database is accessible

### Debug Tips

1. **Check Response Headers**

   - Look for `Set-Cookie` header in login response
   - Verify `Content-Type` headers

2. **Console Logs**

   - Check Postman console for automatic variable setting
   - Look for error messages in response body

3. **Environment Variables**
   - Use the "Environment Quick Look" to verify variable values
   - Check if variables are being set correctly

## 🎯 Best Practices

### Testing Strategy

1. **Start with Health Check**

   - Always verify the server is running first

2. **Test Authentication First**

   - Ensure login works before testing other endpoints

3. **Create Test Data**

   - Use the collection to create sample data
   - Use environment variables to store IDs

4. **Test CRUD Operations**

   - Test Create → Read → Update → Delete sequence
   - Verify data integrity

5. **Test Error Cases**
   - Try invalid data
   - Test unauthorized access
   - Verify proper error responses

### Environment Management

1. **Use Different Environments**

   - Create separate environments for development, staging, production
   - Use different base URLs and credentials

2. **Secure Sensitive Data**

   - Mark passwords and tokens as "secret" type
   - Don't commit environment files with real credentials

3. **Version Control**
   - Export and backup your collection regularly
   - Use descriptive names for saved responses

## 📊 Response Validation

### Expected Response Format

All API responses follow this format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": { /* response data */ }
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔄 Running the Collection

### Manual Testing

1. Select the environment
2. Run requests individually
3. Check responses and update variables as needed

### Automated Testing

1. **Create a Test Suite**

   - Add test scripts to requests
   - Use Postman's test runner

2. **Example Test Script**

   ```javascript
   pm.test('Status code is 200', function () {
     pm.response.to.have.status(200);
   });

   pm.test('Response has success field', function () {
     const response = pm.response.json();
     pm.expect(response).to.have.property('success');
   });
   ```

3. **Run Collection**
   - Use "Run Collection" feature
   - Set up test iterations
   - Generate test reports

## 📞 Support

If you encounter issues:

1. Check the API documentation (`API_DOCUMENTATION.md`)
2. Verify server logs for backend errors
3. Test with curl or other tools to isolate issues
4. Check Postman console for detailed error messages

## 🎉 Next Steps

After setting up the Postman collection:

1. **Explore all endpoints** to understand the API
2. **Create comprehensive test suites** for your use cases
3. **Set up automated testing** for CI/CD pipelines
4. **Share the collection** with your team
5. **Customize requests** for your specific needs

Happy testing! 🚀
