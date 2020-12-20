import React, { useMemo, useState } from 'react';

// bring in dependencies
import axios from 'axios';
import moment from 'moment';
import './MeetingMinutes.css';

// bring in redux

// bring in components
import Spinner from '../layout/Spinner';
import MeetingMinutesItem from './MeetingMinutesItem';

// bring in actions

// bring in functions and hooks
import setAuthToken from '../../utils/setAuthToken';

// set initial state

// wordpress base URL
const baseURL = 'https://public-api.wordpress.com/wp/v2/sites/damwidi.wordpress.com/';

const MeetingMinutes = () => {
    // states for loading status
    const [loading, setLoading] = useState(true);

    // states for meeting minutes
    const [minutes, setMinutes] = useState([]);
    const [post, setPost] = useState({});

    // pagination state
    const [index, setIndex] = useState(0);

    // load minutes when component loads
    useMemo(async () => {
        try {
            // temporarily remove default header
            delete axios.defaults.headers.common['x-auth-token'];

            const minutesWP = await axios.get(`${baseURL}posts?categories=19319&context=embed`);
            setMinutes(minutesWP.data);
            // setLoading(false);

            // reinstate default header
            setAuthToken(localStorage.token);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // load meeting minute post
    useMemo(async () => {
        if (minutes.length > 0) {
            fetch(`${baseURL}posts/${minutes[index].id}`)
                .then((response) => response.json())
                .then((data) => {
                    setLoading(true);
                    setPost(data);
                    setLoading(false);
                });
        }
    }, [index, minutes]);

    return loading ? (
        <Spinner />
    ) : (
        <>
            <div className='minutesWrapper'>
                <div className='minutes__Pagination'>
                    <div>
                        <button className='btn btn-sm btn-outline-secondary mr-1' onClick={() => setIndex((prevIndex) => prevIndex - 1)} disabled={index === 0}>
                            <i className='fas fa-angle-left pt-1'></i>
                        </button>
                        <button className='btn btn-sm btn-outline-secondary mr-1' onClick={() => setIndex((prevIndex) => prevIndex + 1)} disabled={index === minutes.length - 1}>
                            <i className='fas fa-angle-right pt-1'></i>
                        </button>
                    </div>
                    <h4>Meeting Minutes</h4>
                    <h5>{moment(minutes[index].date).format('MMM DD, YYYY')}</h5>
                </div>
                <MeetingMinutesItem postID={minutes[index].id} post={post} />
            </div>
        </>
    );
};

export default MeetingMinutes;
