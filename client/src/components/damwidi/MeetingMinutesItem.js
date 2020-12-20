import React from 'react';

// bring in dependencies

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

const MeetingMinutesItem = ({ postID, post }) => {
    // destructure
    const { rendered: content } = post.content;

    return (
        <div>
            <p dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
};

export default MeetingMinutesItem;
