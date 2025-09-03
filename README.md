# 🎓 Student Management System (SMS)

A comprehensive web-based Student Management System built for Maharaja Institute Of Technology's AI Department. This modern, full-stack application provides complete management capabilities for students, faculty, and administrators.

![SMS Dashboard](https://img.shields.io/badge/Status-Production--Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)
![Express](https://img.shields.io/badge/Express-4.18+-lightgrey)

## ✨ Features

### 👨‍🎓 Student Features
- **Dashboard Overview** - Personal academic information at a glance
- **Course Management** - View enrolled subjects and schedules
- **Assignment Tracking** - Submit and track assignments
- **Attendance Monitoring** - Real-time attendance records
- **Grade Viewing** - Access IA marks and results
- **Document Management** - Upload and download academic documents
- **Notification Center** - Stay updated with announcements

### 👨‍🏫 Admin Features
- **User Management** - Add, edit, and manage students and faculty
- **Course Administration** - Create and manage subjects
- **Assignment Management** - Create and grade assignments
- **Attendance Tracking** - Mark and monitor attendance
- **Results Management** - Upload and manage IA marks
- **Document Distribution** - Send documents to students
- **Notification System** - Broadcast announcements
- **Bulk Operations** - Import students via CSV

### 🔐 Security Features
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access** - Separate permissions for students and admins
- **Session Management** - Automatic logout and session handling
- **Cache Prevention** - Ultra-aggressive cache control
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Comprehensive data validation

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/preethm19/Department-Website.git
   cd Department-Website
   ```

2. **Navigate to SMS directory**
   ```bash
   cd sms
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE sms_db;
   EXIT;

   # Import database schema
   mysql -u root -p sms_db < main.sql
   ```

5. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env file with your settings
   nano .env
   ```

6. **Start the Application**
   ```bash
   npm start
   ```

7. **Access the Application**
   - **SMS System:** http://localhost:3000
   - **Default Admin:** admin@sms.com / password
   - **Student Access:** Register or use sample data

## 📁 Project Structure

```
Department Website/
├── sms/                          # Main application directory
│   ├── db.js                     # Database connection module
│   ├── server.js                 # Main Express server
│   ├── main.sql                  # Complete database schema
│   ├── package.json              # Dependencies and scripts
│   ├── .env                      # Environment configuration
│   ├── scripts/                  # Utility scripts
│   │   ├── database/             # Database management scripts
│   │   ├── setup/                # Setup and configuration
│   │   ├── test/                 # Testing scripts
│   │   └── utils/                # General utilities
│   ├── public/                   # Static web files
│   │   ├── index.html            # Login page
│   │   ├── login.html            # Alternative login
│   │   ├── css/
│   │   │   └── style.css         # Global styles
│   │   ├── js/
│   │   │   ├── auth.js           # Authentication handling
│   │   │   ├── login.js          # Login functionality
│   │   │   ├── student.js        # Student dashboard
│   │   │   └── admin.js          # Admin dashboard
│   │   ├── student/              # Student pages
│   │   │   ├── dashboard.html
│   │   │   ├── profile.html
│   │   │   ├── classes.html
│   │   │   ├── assignments.html
│   │   │   ├── attendance.html
│   │   │   ├── marks.html
│   │   │   ├── notifications.html
│   │   │   └── documents.html
│   │   ├── admin/                # Admin pages
│   │   │   ├── dashboard.html
│   │   │   ├── users.html
│   │   │   ├── classes.html
│   │   │   ├── assignments.html
│   │   │   ├── attendance.html
│   │   │   ├── grades.html
│   │   │   ├── materials.html
│   │   │   ├── notifications.html
│   │   │   ├── reports.html
│   │   │   └── documents.html
│   │   ├── templates/            # CSV templates
│   │   ├── uploads/              # File upload directory
│   │   └── images/               # Static images
│   └── uploads/                  # Server upload directory
├── images/                       # Project images
├── package.json                  # Root package file
└── README.md                     # This file
```

## 🗄️ Database Schema

The application uses MySQL with the following main tables:

### Core Tables
- **`users`** - Students, admins, and faculty accounts
- **`subjects`** - Course information and metadata
- **`enrollments`** - Student-subject relationships
- **`materials`** - Course materials and resources

### Academic Tables
- **`assignments`** - Assignment details and requirements
- **`submissions`** - Student assignment submissions
- **`attendance`** - Daily attendance records
- **`results`** - IA marks and grade storage

### Communication Tables
- **`notifications`** - System notifications
- **`admin_notifications`** - Admin-sent notifications
- **`notification_recipients`** - Notification delivery tracking
- **`documents`** - File storage and management

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sms_db

# Server Configuration
PORT=3000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# Department Configuration
DEPARTMENT=AI
MAIN_WEBSITE_URL=http://localhost:3000
```

## 📡 API Endpoints

### Authentication
- `POST /login` - User authentication
- `POST /logout` - User logout

### Student Endpoints
- `GET /profile` - Get user profile
- `GET /subjects` - Get enrolled subjects
- `GET /assignments` - Get assignments
- `GET /attendance` - Get attendance records
- `GET /marks` - Get IA marks and results
- `GET /notifications` - Get notifications
- `GET /documents` - Get documents
- `POST /upload-document` - Upload documents

### Admin Endpoints
- `GET /admin/users` - Manage users
- `POST /admin/create-admin` - Create admin accounts
- `GET /admin/classes` - Manage subjects
- `POST /admin/classes` - Create subjects
- `GET /admin/assignments` - Manage assignments
- `GET /admin/attendance` - Manage attendance
- `POST /admin/upload-results` - Upload results
- `GET /admin/export-users` - Export user data
- `POST /admin/bulk-import` - Bulk import students

## 🛠️ Development

### Available Scripts
```bash
# Start development server
npm start

# Run with nodemon (if installed)
npm run dev

# Install dependencies
npm install

# Run database scripts
node scripts/database/add_columns.js
node scripts/setup/insert_sample.js
```

### Database Management
```bash
# Reset database
mysql -u root -p sms_db < main.sql

# Run utility scripts
node scripts/utils/fix_file_paths.js
node scripts/test/test_api.js
```

## 🔒 Security Features

- **JWT Token Authentication** - Secure session management
- **Password Hashing** - bcryptjs for secure password storage
- **Input Sanitization** - Protection against XSS attacks
- **CORS Configuration** - Controlled cross-origin access
- **File Upload Security** - Size limits and type validation
- **Session Expiry** - Automatic logout on inactivity
- **Cache Prevention** - Prevents browser caching of sensitive data

## 📊 Sample Data

The system includes sample data for testing:

### Default Admin Account
- **Email:** admin@sms.com
- **Password:** password

### Sample Students
- **USN:** 1AI20CS001, 1AI20CS002, 1AI20CS003
- **Password:** password (hashed)

### Sample Subjects
- Data Structures (CS101)
- Database Management (CS102)
- Web Development (CS103)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write clear commit messages
- Test all new features
- Update documentation
- Maintain code quality standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

