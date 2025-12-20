/**
 * Environment Variables Validation
 * Ensures all required environment variables are set before server starts
 */

const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

const optionalEnvVars = [
    { name: 'ADMIN_USERNAME', description: 'Admin user will not be seeded without this' },
    { name: 'ADMIN_PASSWORD', description: 'Admin user will not be seeded without this' },
    { name: 'ALLOWED_ORIGINS', description: 'Defaults to http://localhost:5173' },
    { name: 'PORT', description: 'Defaults to 3000' }
];

export const validateEnv = () => {
    console.log('\n🔍 Validating environment variables...\n');

    // Check required variables
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        console.error('❌ FATAL ERROR: Missing required environment variables:\n');
        missing.forEach(varName => console.error(`   - ${varName}`));
        console.error('\n💡 Please create a .env file with all required variables.');
        console.error('   See .env.example for a template.\n');
        process.exit(1);
    }

    // Check optional variables
    const missingOptional = optionalEnvVars.filter(({ name }) => !process.env[name]);
    if (missingOptional.length > 0) {
        console.warn('⚠️  Warning: Missing optional environment variables:\n');
        missingOptional.forEach(({ name, description }) => {
            console.warn(`   - ${name}: ${description}`);
        });
        console.warn('');
    }

    console.log('✅ All required environment variables are set\n');

    // Log configuration (without sensitive data)
    console.log('📋 Server Configuration:');
    console.log(`   - Database: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`   - Port: ${process.env.PORT || 3000}`);
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log('');
};

export default validateEnv;
