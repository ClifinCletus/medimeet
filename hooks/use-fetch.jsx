//hook for the data fetching

import { toast } from "sonner";

const { useState } = require("react");

const useFetch = (callback) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    //...args if need any extra arguments to be passed in api call
    setLoading(true);
    setError(null);

    try {
      const response = await callback(...args); //means just calling the api or any other fns with api (eg:setUserRole fn with api, we using this) with the data if any to be passed
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
  //setdata added here if needed to manipulate the data from outside(other pages where we call it)
};

export default useFetch;
