import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class TestBcrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder(12);
        boolean match = enc.matches("SecurePass@1234", "$2a$12$h8PklBj9QVsPlmp2DZYRWOzETIVP4FlrgD95xXQ1xNoSE80kbV4/m");
        System.out.println("Match: " + match);
    }
}
