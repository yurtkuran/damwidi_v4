module.exports = (sequelize, Sequelize, DataTypes) => {
    const Transaction = sequelize.define(
        'Transaction',
        {
            date: {
                field: 'transaction_date',
                type: Sequelize.DATEONLY,
                allowNull: false,
                primaryKey: true,
            },
            symbol: {
                type: Sequelize.CHAR(5),
                allowNull: false,
                trim: true,
            },
            type: {
                type: Sequelize.CHAR(1),
                allowNull: false,
                trim: true,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            shares: {
                type: Sequelize.DECIMAL(10, 5),
                allowNull: false,
                defaultValue: 0.0,
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: '',
                trim: true,
            },
        },
        {
            tableName: 'data_transactions',
            timestamps: false,
            paranoid: true,
        }
    );
    return Transaction;
};
