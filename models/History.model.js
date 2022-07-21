module.exports = (sequelize, Sequelize, DataTypes) => {
    const History = sequelize.define(
        'History',
        {
            symbol: {
                type: DataTypes.CHAR(5),
                allowNull: false,
                trim: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            open: {
                type: DataTypes.CHAR(5),
                type: DataTypes.DECIMAL(8, 4),
                allowNull: false,
                defaultValue: 0.0,
            },
            high: {
                type: DataTypes.CHAR(5),
                type: DataTypes.DECIMAL(8, 4),
                allowNull: false,
                defaultValue: 0.0,
            },
            low: {
                type: DataTypes.CHAR(5),
                type: DataTypes.DECIMAL(8, 4),
                allowNull: false,
                defaultValue: 0.0,
            },
            close: {
                type: DataTypes.CHAR(5),
                type: DataTypes.DECIMAL(8, 4),
                allowNull: false,
                defaultValue: 0.0,
            },
        },
        {
            tableName: 'data_history',
            timestamps: false,
            paranoid: true,
        }
    );
    return History;
};
