const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Table: Students
const Student = sequelize.define(
  'Student',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    rollNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: { msg: 'This roll number already exists.' },
      validate: { notEmpty: { msg: 'Roll number is required.' } }
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'Name is required.' } }
    },

    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: { msg: 'This email already exists.' },
      validate: {
        notEmpty: { msg: 'Email is required.' },
        isEmail: { msg: 'Enter a valid email address.' }
      }
    },

    course: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: { notEmpty: { msg: 'Course is required.' } }
    },

    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'Age must be a whole number.' },
        min: { args: [15], msg: 'Age must be at least 15.' },
        max: { args: [100], msg: 'Age must be at most 100.' }
      }
    }
  },
  { tableName: 'students', timestamps: true }
);

module.exports = Student;
