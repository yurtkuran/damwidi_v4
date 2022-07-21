module.exports = (sequelize, Sequelize, DataTypes) => {
    const Sector = sequelize.define(
        'Sector',
        {
            symbol: {
                field: 'sector',
                type: DataTypes.CHAR(5),
                allowNull: false,
                trim: true,
                // primaryKey:   true
            },
            weight: {
                type: DataTypes.DECIMAL(4, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            shares: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            basis: {
                type: DataTypes.DECIMAL(8, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            previous: {
                type: DataTypes.DECIMAL(8, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            '1wk': {
                type: DataTypes.DECIMAL(6, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            '2wk': {
                type: DataTypes.DECIMAL(6, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            '4wk': {
                type: DataTypes.DECIMAL(6, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            '8wk': {
                type: DataTypes.DECIMAL(6, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            '1qtr': {
                type: DataTypes.DECIMAL(6, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            '1yr': {
                type: DataTypes.DECIMAL(6, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            ytd: {
                type: DataTypes.DECIMAL(6, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            'as-of': {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: '',
                trim: true,
            },
            description: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: '',
                trim: true,
            },
            sectorDescription: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: '',
                trim: true,
            },
            effectiveDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            fetchedDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            type: {
                type: DataTypes.CHAR(1),
                defaultValue: '',
                allowNull: false,
            },
        },
        {
            tableName: 'data_performance',
            timestamps: true,
        }
    );
    return Sector;
};
