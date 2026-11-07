package uy.com.urujobs;

import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessagingService;

public class UrujobsFirebaseMessagingService extends FirebaseMessagingService {
    @Override
    public void onNewToken(@NonNull String token) {
        MainActivity.setFcmToken(token);
    }
}
