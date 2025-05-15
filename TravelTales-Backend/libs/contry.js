const axios = require('axios');
const RESTCOUNTRIES_URL = 'https://restcountries.com/v3.1';

exports.getCountryInfo = async (countryName) => {
    try {
        const response = await axios.get(`${RESTCOUNTRIES_URL}/name/${countryName}`);
        if (response.status !== 200) {
            throw new Error("Failed to fetch data from restcountries.");
        }

        const countriesData = response.data;
        return countriesData.map(c => ({
            country_name: c.name?.common || 'N/A',
            capital: Array.isArray(c.capital) ? c.capital[0] : 'N/A',
            languages: c.languages ? Object.values(c.languages) : [],
            currencies: c.currencies
                ? Object.entries(c.currencies).map(([curCode, curInfo]) => ({
                    code: curCode,
                    name: curInfo.name || "",
                    symbol: curInfo.symbol || ""
                }))
                : [],
            flag_url: c.flags?.png || ''
        }));
    } catch (error) {
        console.error("Error fetching country data:", error);
        throw error;
    }
};