import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <section className='landing'>
            <div className='dark-overlay'>
                <div className='header'>
                    <nav>
                        <ul>
                            <li>
                                <Link to='/login'>Login</Link>
                            </li>
                            <li>
                                <Link to='/register'>Register</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className='landing-inner'>
                    <h1 className='landing-text'>DAMWIDI Investments</h1>
                </div>
            </div>
        </section>
    );
};

export default Landing;
