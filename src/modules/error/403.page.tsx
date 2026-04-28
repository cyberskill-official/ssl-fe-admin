import { useNavigate } from 'react-router';

import { Button } from '#shared/component/button';
import { ROUTES } from '#shared/constant';

import { useAuth } from '../authn/auth.hook';

export default function ForbiddenError() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout(() => {
            navigate(ROUTES.AUTH.LOGIN, { replace: true });
        });
    };

    return (
        <div className="h-svh">
            <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                <h1 className="text-[7rem] leading-tight font-bold">403</h1>
                <span className="font-medium">Access Forbidden!</span>
                <p className="text-muted-foreground text-center">
                    You don't have permission to access this page.
                    &nbsp;
                    <br />
                    This area is restricted to administrators only.
                </p>
                <div className="mt-6 flex gap-4">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                    <Button onClick={handleLogout}>Logout</Button>
                </div>
            </div>
        </div>
    );
}
