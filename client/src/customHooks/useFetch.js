import { useEffect, useState } from 'react';

// bring in dependencies
import axios from 'axios';

const useFetch = (url) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const abortCont = new AbortController();
        setTimeout(async () => {
            try {
                const res = await axios.get(url);
                setData(res.data);
                setIsLoading(false);
                setError(null);
            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log('fetch aborted');
                } else {
                    setError(err.message);
                    setIsLoading(false);
                }
            }
        }, 100);

        return () => abortCont.abort();
    }, [url]);

    return { data, isLoading, error };
};

export default useFetch;
