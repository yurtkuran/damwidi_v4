module.exports = (sequelize, Sequelize, { CHAR } = DataTypes) => {
    const Stock = sequelize.define(
        'Stock',
        {
            sector: {
                type: CHAR(5),
                allowNull: false,
                trim: true,
            },
            symbol: {
                type: CHAR(5),
                allowNull: false,
                trim: true,
            },
            companyName: {
                type: CHAR(5),
                allowNull: false,
                trim: true,
            },
        },
        {
            tableName: 'data_stocks',
            timestamps: true,
            paranoid: true,
        }
    );
    return Stock;
};
