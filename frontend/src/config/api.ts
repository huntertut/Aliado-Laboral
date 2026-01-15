import { API_URL } from './constants';

export { API_URL };

export const endpoints = {
    auth: {
        login: `${API_URL}/auth/login`,
        register: `${API_URL}/auth/register`,
    },
    contact: {
        createRequest: `${API_URL}/contact/request`,
        myRequests: `${API_URL}/contact/my-requests`,
        lawyerRequests: `${API_URL}/contact/lawyer/requests`,
        acceptRequest: (id: string) => `${API_URL}/contact/lawyer/request/${id}/accept`,
        rejectRequest: (id: string) => `${API_URL}/contact/lawyer/request/${id}/reject`,
        getContact: (id: string) => `${API_URL}/contact/lawyer/request/${id}/contact`,
    }
};
