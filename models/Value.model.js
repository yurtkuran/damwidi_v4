module.exports = (sequelize, Sequelize, DataTypes) => {
    const Value = sequelize.define(
        'Value',
        {
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                primaryKey: true,
            },
            SPY: {
                type: DataTypes.DECIMAL(8, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            cash: {
                type: DataTypes.DECIMAL(8, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            market_value: {
                type: DataTypes.DECIMAL(10, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            account_value: {
                type: DataTypes.DECIMAL(10, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            payments: {
                type: DataTypes.DECIMAL(8, 3),
                allowNull: false,
                defaultValue: 0.0,
            },
            total_shares: {
                type: DataTypes.DECIMAL(12, 6),
                allowNull: false,
                defaultValue: 0.0,
            },
            share_value: {
                type: DataTypes.DECIMAL(8, 6),
                allowNull: false,
                defaultValue: 0.0,
            },
            bivio_value: {
                type: DataTypes.DECIMAL(8, 6),
                allowNull: false,
                defaultValue: 0.0,
            },
            open: {
                type: DataTypes.DECIMAL(8, 6),
                allowNull: false,
                defaultValue: 0.0,
            },
            high: {
                type: DataTypes.DECIMAL(8, 6),
                allowNull: false,
                defaultValue: 0.0,
            },
            low: {
                type: DataTypes.DECIMAL(8, 6),
                allowNull: false,
                defaultValue: 0.0,
            },
            close: {
                type: DataTypes.DECIMAL(8, 6),
                allowNull: false,
                defaultValue: 0.0,
            },
            source: {
                type: DataTypes.STRING,
                allowNull: false,
                trim: true,
            },
            updated: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: 'data_value',
            timestamps: false,
            paranoid: true,
        }
    );
    return Value;
};
